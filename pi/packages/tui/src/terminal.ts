import * as fs from "node:fs";
import * as path from "node:path";
import { setKittyProtocolActive } from "./keys.ts";
import { isNativeModifierPressed } from "./native-modifiers.ts";
import { StdinBuffer } from "./stdin-buffer.ts";
import { parseDecimalInt, parseDecimalNumber } from "./utils.ts";

const TERMINAL_PROGRESS_KEEPALIVE_MS = 1000;
const TERMINAL_PROGRESS_ACTIVE_SEQUENCE = "\x1b]9;4;3\x07";
const TERMINAL_PROGRESS_CLEAR_SEQUENCE = "\x1b]9;4;0\x07";
const NATIVE_SHIFT_ENTER_SEQUENCE = "\x1b[13;2u";
const DESIRED_KITTY_KEYBOARD_PROTOCOL_FLAGS = 7;
const KEYBOARD_PROTOCOL_RESPONSE_FRAGMENT_TIMEOUT_MS = 150;
const KITTY_KEYBOARD_PROTOCOL_QUERY = `\x1b[>${DESIRED_KITTY_KEYBOARD_PROTOCOL_FLAGS}u\x1b[?u\x1b[c`;

export type KeyboardProtocolNegotiationSequence =
	| { type: "kitty-flags"; flags: number }
	| { type: "device-attributes" };

export function parseKeyboardProtocolNegotiationSequence(
	sequence: string,
): KeyboardProtocolNegotiationSequence | undefined {
	const kittyFlags = sequence.match(/^\x1b\[\?(\d+)u$/);
	if (kittyFlags) {
		return { type: "kitty-flags", flags: parseDecimalInt(kittyFlags[1]!) ?? 0 };
	}
	if (/^\x1b\[\?[\d;]*c$/.test(sequence)) {
		return { type: "device-attributes" };
	}
	return undefined;
}

function isKeyboardProtocolNegotiationSequencePrefix(sequence: string): boolean {
	return sequence === "\x1b[" || /^\x1b\[\?[\d;]*$/.test(sequence);
}

export function isAppleTerminalSession(): boolean {
	return process.platform === "darwin" && process.env.TERM_PROGRAM === "Apple_Terminal";
}

export function normalizeNativeShiftEnterInput(
	data: string,
	shouldDetectNativeShiftEnter: boolean,
	isShiftPressed: boolean,
): string {
	if (shouldDetectNativeShiftEnter && data === "\r" && isShiftPressed) return NATIVE_SHIFT_ENTER_SEQUENCE;
	return data;
}

export function normalizeAppleTerminalInput(data: string, isAppleTerminal: boolean, isShiftPressed: boolean): string {
	return normalizeNativeShiftEnterInput(data, isAppleTerminal, isShiftPressed);
}

/**
 * Minimal terminal interface for TUI
 */
export interface Terminal {
	// Start the terminal with input and resize handlers
	start(onInput: (data: string) => void, onResize: () => void): void;

	// Stop the terminal and restore state
	stop(): void;

	/**
	 * Drain stdin before exiting to prevent Kitty key release events from
	 * leaking to the parent shell over slow SSH connections.
	 * @param maxMs - Maximum time to drain (default: 1000ms)
	 * @param idleMs - Exit early if no input arrives within this time (default: 50ms)
	 */
	drainInput(maxMs?: number, idleMs?: number): Promise<void>;

	// Write output to terminal
	write(data: string): void;

	// Get terminal dimensions
	columns(): number;
	rows(): number;

	// Whether Kitty keyboard protocol is active
	kittyProtocolActive(): boolean;

	// Cursor positioning (relative to current position)
	moveBy(lines: number): void; // Move cursor up (negative) or down (positive) by N lines

	// Cursor visibility
	hideCursor(): void; // Hide the cursor
	showCursor(): void; // Show the cursor

	// Clear operations
	clearLine(): void; // Clear current line
	clearFromCursor(): void; // Clear from cursor to end of screen
	clearScreen(): void; // Clear entire screen and move cursor to (0,0)

	// Title operations
	setTitle(title: string): void; // Set terminal window title

	// Progress indicator (OSC 9;4)
	setProgress(active: boolean): void;
}

const DEFAULT_ESCAPE_TIMEOUT_MS = 10;
const DEFAULT_SSH_ESCAPE_TIMEOUT_MS = 100;

/**
 * Resolve how long to wait for the rest of an escape sequence before
 * dispatching a lone ESC as the Escape key. Legacy Alt+key input is ESC plus
 * another byte, so high-latency transports need a longer reassembly window.
 */
export function resolveEscapeTimeoutMs(env: NodeJS.ProcessEnv = process.env): number {
	const configured = parseDecimalNumber(env.PI_TUI_ESC_TIMEOUT ?? "");
	if (configured !== undefined && configured > 0) {
		return configured;
	}
	if (env.SSH_CONNECTION || env.SSH_TTY) {
		return DEFAULT_SSH_ESCAPE_TIMEOUT_MS;
	}
	return DEFAULT_ESCAPE_TIMEOUT_MS;
}

/**
 * Real terminal using process.stdin/stdout
 */
export class ProcessTerminal implements Terminal {
	private resizePollTimer: ReturnType<typeof setInterval> | undefined;
	private lastColumns = 80;
	private lastRows = 24;
	private inputHandler?: (data: string) => void;
	private resizeHandler?: () => void;
	private _kittyProtocolActive = false;
	private _modifyOtherKeysActive = false;
	private keyboardProtocolPushed = false;
	private keyboardProtocolNegotiationBuffer = "";
	private keyboardProtocolBufferFlushTimer?: ReturnType<typeof setTimeout>;
	private stdinBuffer?: StdinBuffer;
	private stdinDataHandler?: (data: Uint8Array) => void;
	// Trailing bytes of a stdin chunk that ended mid multi-byte UTF-8 sequence.
	// TextDecoder has no streaming mode in the scriptc runtime, and decoding a
	// partial sequence emits U+FFFD, which would corrupt emoji/CJK input split
	// across stdin chunks. The bytes are held back and prepended to the next
	// chunk before decoding.
	private pendingUtf8Tail: Uint8Array = new Uint8Array(0);
	private progressInterval?: ReturnType<typeof setInterval>;
	private writeLogPath = (() => {
		const env = process.env.PI_TUI_WRITE_LOG || "";
		if (!env) return "";
		try {
			if (fs.statSync(env).isDirectory()) {
				const now = new Date();
				const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
				return path.join(env, `tui-${ts}-${process.pid}.log`);
			}
		} catch {
			// Not an existing directory - use as-is (file path)
		}
		return env;
	})();

	kittyProtocolActive(): boolean {
		return this._kittyProtocolActive;
	}

	get modifyOtherKeysActive(): boolean {
		return this._modifyOtherKeysActive;
	}

	start(onInput: (data: string) => void, onResize: () => void): void {
		this.inputHandler = onInput;
		this.resizeHandler = onResize;

		// Enable raw mode. Non-TTY stdin has no setRawMode (Node throws a
		// catchable TypeError there); the previous raw state is not observable
		// without extra surfaces, so restore always returns to cooked mode.
		try {
			process.stdin.setRawMode(true);
		} catch {}

		// Enable bracketed paste mode - terminal will wrap pastes in \x1b[200~ ... \x1b[201~
		process.stdout.write("\x1b[?2004h");

		// Set up resize detection: poll the terminal dimensions (scriptc has
		// no stdout resize event) and fire the handler on change.
		this.lastColumns = this.columns();
		this.lastRows = this.rows();
		this.resizePollTimer = setInterval(() => {
			const cols = this.columns();
			const rws = this.rows();
			if (cols !== this.lastColumns || rws !== this.lastRows) {
				this.lastColumns = cols;
				this.lastRows = rws;
				const resizeHandler = this.resizeHandler;
				if (resizeHandler) resizeHandler();
			}
		}, 250);

		// Refresh terminal dimensions - they may be stale after suspend/resume
		// (SIGWINCH is lost while process is stopped). Unix only.
		if (process.platform !== "win32") {
			process.kill(process.pid, "SIGWINCH");
		}

		// On Windows, enable ENABLE_VIRTUAL_TERMINAL_INPUT so the console sends
		// VT escape sequences (e.g. \x1b[Z for Shift+Tab) instead of raw console
		// events that lose modifier information. Must run AFTER setRawMode(true)
		// since that resets console mode flags.
		this.enableWindowsVTInput();

		// Query Kitty keyboard protocol and fall back to modifyOtherKeys when DA confirms no Kitty response.
		// See: https://sw.kovidgoyal.net/kitty/keyboard-protocol/
		this.queryAndEnableKittyProtocol();
	}

	/**
	 * Set up StdinBuffer to split batched input into individual sequences.
	 * This ensures components receive single events, making matchesKey/isKeyRelease work correctly.
	 *
	 * Also watches for Kitty protocol response and enables it when detected.
	 * This is done here (after stdinBuffer parsing) rather than on raw stdin
	 * to handle the case where the response arrives split across multiple events.
	 */
	private setupStdinBuffer(): void {
		this.stdinBuffer = new StdinBuffer({ escapeTimeout: resolveEscapeTimeoutMs() });

		// Forward individual sequences to the input handler
		this.stdinBuffer.on("data", (sequence) => {
			const negotiationSequence = this.readKeyboardProtocolNegotiationSequence(sequence);
			if (negotiationSequence === "pending") {
				this.scheduleKeyboardProtocolNegotiationBufferFlush();
				return; // Wait briefly for the rest of a split Kitty response.
			}
			if (this.handleKeyboardProtocolNegotiationSequence(negotiationSequence)) {
				return;
			}

			this.forwardInputSequence(sequence);
		});

		// Re-wrap paste content with bracketed paste markers for existing editor handling
		this.stdinBuffer.on("paste", (content) => {
			const inputHandler = this.inputHandler;
			if (inputHandler) {
				inputHandler(`\x1b[200~${content}\x1b[201~`);
			}
		});

		// Handler that pipes stdin data through the buffer
		this.stdinDataHandler = (chunk: Uint8Array) => {
			this.stdinBuffer?.process(this.decodeUtf8Chunk(chunk));
		};
	}

	/**
	 * Query terminal for Kitty keyboard protocol support and enable it if available.
	 *
	 * Kitty's progressive enhancement detection requires requesting the desired
	 * flags before querying them. The trailing DA query is a sentinel supported by
	 * terminals that do not know Kitty keyboard protocol; receiving DA before a
	 * Kitty response enables modifyOtherKeys fallback without a startup timeout.
	 *
	 * The requested flags are:
	 * - 1 = disambiguate escape codes
	 * - 2 = report event types (press/repeat/release)
	 * - 4 = report alternate keys (shifted key, base layout key)
	 */
	/**
	 * Decode one stdin chunk to a string while holding back any trailing
	 * incomplete multi-byte UTF-8 sequence until the next chunk completes it.
	 */
	private decodeUtf8Chunk(chunk: Uint8Array): string {
		const bytes = new Uint8Array(this.pendingUtf8Tail.length + chunk.length);
		bytes.set(this.pendingUtf8Tail, 0);
		bytes.set(chunk, this.pendingUtf8Tail.length);
		this.pendingUtf8Tail = new Uint8Array(0);

		// Count trailing bytes that belong to an unfinished multi-byte sequence:
		// scan back over continuation bytes (0b10xxxxxx) to the leading byte.
		let tailLength = 0;
		for (let back = 1; back <= 3 && back <= bytes.length; back++) {
			const b = bytes[bytes.length - back]!;
			if ((b & 0xc0) === 0x80) continue;
			const expected = b >= 0xf0 ? 4 : b >= 0xe0 ? 3 : b >= 0xc0 ? 2 : 1;
			if (expected > back) {
				tailLength = back;
			}
			break;
		}

		if (tailLength > 0) {
			this.pendingUtf8Tail = bytes.slice(bytes.length - tailLength);
			return new TextDecoder().decode(bytes.slice(0, bytes.length - tailLength));
		}
		return new TextDecoder().decode(bytes);
	}

	private queryAndEnableKittyProtocol(): void {
		this.setupStdinBuffer();
		process.stdin.on("data", (chunk: Uint8Array) => {
			this.stdinDataHandler?.(chunk);
		});
		this.keyboardProtocolPushed = true;
		this.clearKeyboardProtocolNegotiationBuffer();
		process.stdout.write(KITTY_KEYBOARD_PROTOCOL_QUERY);
	}

	private handleKeyboardProtocolNegotiationSequence(
		negotiationSequence: KeyboardProtocolNegotiationSequence | undefined,
	): boolean {
		if (!negotiationSequence) return false;
		this.clearKeyboardProtocolNegotiationBuffer();
		if (negotiationSequence.type === "kitty-flags") {
			if (negotiationSequence.flags !== 0) {
				this.disableModifyOtherKeys();
				if (!this._kittyProtocolActive) {
					this._kittyProtocolActive = true;
					setKittyProtocolActive(true);
				}
			} else {
				this.enableModifyOtherKeys();
			}
			return true;
		}

		if (!this._kittyProtocolActive) {
			this.enableModifyOtherKeys();
		}
		return true;
	}

	private readKeyboardProtocolNegotiationSequence(
		sequence: string,
	): KeyboardProtocolNegotiationSequence | "pending" | undefined {
		if (this.keyboardProtocolNegotiationBuffer) {
			const bufferedSequence = this.keyboardProtocolNegotiationBuffer + sequence;
			const negotiationSequence = parseKeyboardProtocolNegotiationSequence(bufferedSequence);
			if (negotiationSequence) {
				this.clearKeyboardProtocolNegotiationBuffer();
				return negotiationSequence;
			}
			if (isKeyboardProtocolNegotiationSequencePrefix(bufferedSequence)) {
				this.setKeyboardProtocolNegotiationBuffer(bufferedSequence);
				return "pending";
			}
			this.flushKeyboardProtocolNegotiationBufferAsInput();
		}

		const negotiationSequence = parseKeyboardProtocolNegotiationSequence(sequence);
		if (negotiationSequence) return negotiationSequence;
		if (isKeyboardProtocolNegotiationSequencePrefix(sequence)) {
			this.setKeyboardProtocolNegotiationBuffer(sequence);
			return "pending";
		}
		return undefined;
	}

	private setKeyboardProtocolNegotiationBuffer(sequence: string): void {
		this.clearKeyboardProtocolNegotiationBufferFlushTimer();
		this.keyboardProtocolNegotiationBuffer = sequence;
	}

	private clearKeyboardProtocolNegotiationBuffer(): void {
		this.clearKeyboardProtocolNegotiationBufferFlushTimer();
		this.keyboardProtocolNegotiationBuffer = "";
	}

	private flushKeyboardProtocolNegotiationBufferAsInput(): void {
		if (!this.keyboardProtocolNegotiationBuffer) return;
		const sequence = this.keyboardProtocolNegotiationBuffer;
		this.clearKeyboardProtocolNegotiationBuffer();
		this.forwardInputSequence(sequence);
	}

	private scheduleKeyboardProtocolNegotiationBufferFlush(): void {
		if (!this.keyboardProtocolNegotiationBuffer || this.keyboardProtocolBufferFlushTimer) return;
		this.keyboardProtocolBufferFlushTimer = setTimeout(() => {
			this.keyboardProtocolBufferFlushTimer = undefined;
			this.flushKeyboardProtocolNegotiationBufferAsInput();
		}, KEYBOARD_PROTOCOL_RESPONSE_FRAGMENT_TIMEOUT_MS);
	}

	private clearKeyboardProtocolNegotiationBufferFlushTimer(): void {
		if (!this.keyboardProtocolBufferFlushTimer) return;
		clearTimeout(this.keyboardProtocolBufferFlushTimer);
		this.keyboardProtocolBufferFlushTimer = undefined;
	}

	private forwardInputSequence(sequence: string): void {
		if (!this.inputHandler) return;
		const shouldDetectNativeShiftEnter =
			sequence === "\r" && (isAppleTerminalSession() || process.platform === "win32");
		const input = normalizeNativeShiftEnterInput(
			sequence,
			shouldDetectNativeShiftEnter,
			shouldDetectNativeShiftEnter && isNativeModifierPressed("shift"),
		);
		const inputHandler = this.inputHandler;
		if (inputHandler) inputHandler(input);
	}

	private enableModifyOtherKeys(): void {
		if (this._kittyProtocolActive || this._modifyOtherKeysActive) return;
		process.stdout.write("\x1b[>4;2m");
		this._modifyOtherKeysActive = true;
	}

	private disableModifyOtherKeys(): void {
		if (!this._modifyOtherKeysActive) return;
		process.stdout.write("\x1b[>4;0m");
		this._modifyOtherKeysActive = false;
	}

	/**
	 * On Windows, add ENABLE_VIRTUAL_TERMINAL_INPUT (0x0200) to the stdin
	 * console handle so the terminal sends VT sequences for modified keys
	 * (e.g. \x1b[Z for Shift+Tab). Without this, libuv's ReadConsoleInputW
	 * discards modifier state and Shift+Tab arrives as plain \t.
	 */
	private enableWindowsVTInput(): void {
		if (process.platform !== "win32") return;
		// Native win32 console-mode helper is unavailable in the static build.
	}

	async drainInput(maxMs = 1000, idleMs = 50): Promise<void> {
		const shouldDisableKittyProtocol = this.keyboardProtocolPushed || this._kittyProtocolActive;
		this.clearKeyboardProtocolNegotiationBuffer();
		if (shouldDisableKittyProtocol) {
			// Disable Kitty keyboard protocol first so any late key releases
			// do not generate new Kitty escape sequences.
			process.stdout.write("\x1b[<u");
			this.keyboardProtocolPushed = false;
			this._kittyProtocolActive = false;
			setKittyProtocolActive(false);
		}
		this.disableModifyOtherKeys();

		const previousHandler = this.inputHandler;
		this.inputHandler = undefined;

		let lastDataTime = Date.now();
		let retired = false;
		// scriptc has no stdin removeListener; the listener retires itself by
		// turning into a no-op once this drain finishes.
		const onData = () => {
			if (retired) return;
			lastDataTime = Date.now();
		};

		process.stdin.on("data", onData);
		const endTime = Date.now() + maxMs;

		try {
			while (true) {
				const now = Date.now();
				const timeLeft = endTime - now;
				if (timeLeft <= 0) break;
				if (now - lastDataTime >= idleMs) break;
				await new Promise((resolve) => setTimeout(resolve, Math.min(idleMs, timeLeft)));
			}
		} finally {
			retired = true;
			this.inputHandler = previousHandler;
		}
	}

	stop(): void {
		if (this.clearProgressInterval()) {
			process.stdout.write(TERMINAL_PROGRESS_CLEAR_SEQUENCE);
		}

		// Disable bracketed paste mode
		process.stdout.write("\x1b[?2004l");

		const shouldDisableKittyProtocol = this.keyboardProtocolPushed || this._kittyProtocolActive;
		this.clearKeyboardProtocolNegotiationBuffer();

		// Disable Kitty keyboard protocol if not already done by drainInput()
		if (shouldDisableKittyProtocol) {
			process.stdout.write("\x1b[<u");
			this.keyboardProtocolPushed = false;
			this._kittyProtocolActive = false;
			setKittyProtocolActive(false);
		}
		this.disableModifyOtherKeys();

		// Clean up StdinBuffer
		if (this.stdinBuffer) {
			this.stdinBuffer.destroy();
			this.stdinBuffer = undefined;
		}

		// Detach input routing. The stdin listener stays registered (scriptc has
		// no stdin removeListener surface); with inputHandler cleared it routes
		// nowhere and retired handlers no-op themselves.
		if (this.stdinDataHandler) {
			this.stdinDataHandler = undefined;
		}
		this.inputHandler = undefined;
		if (this.resizePollTimer !== undefined) {
			clearInterval(this.resizePollTimer);
			this.resizePollTimer = undefined;
		}
		this.resizeHandler = undefined;

		// Restore cooked mode.
		try {
			process.stdin.setRawMode(false);
		} catch {}
	}

	write(data: string): void {
		process.stdout.write(data);
		if (this.writeLogPath) {
			try {
				fs.appendFileSync(this.writeLogPath, data);
			} catch {
				// Ignore logging errors
			}
		}
	}

	columns(): number {
		const declared = (process.stdout as { columns?: number | undefined }).columns;
		if (declared !== undefined && declared > 0) return declared;
		const envCols = process.env.COLUMNS;
		if (envCols !== undefined) {
			const parsed = Number(envCols);
			if (parsed > 0) return parsed;
		}
		return 80;
	}

	rows(): number {
		const declared = (process.stdout as { columns?: number | undefined }).columns;
		if (declared !== undefined) return declared;
		const envRows = process.env.LINES;
		if (envRows !== undefined) {
			const parsed = Number(envRows);
			if (parsed > 0) return parsed;
		}
		return 24;
	}

	moveBy(lines: number): void {
		if (lines > 0) {
			// Move down
			process.stdout.write(`\x1b[${lines}B`);
		} else if (lines < 0) {
			// Move up
			process.stdout.write(`\x1b[${-lines}A`);
		}
		// lines === 0: no movement
	}

	hideCursor(): void {
		process.stdout.write("\x1b[?25l");
	}

	showCursor(): void {
		process.stdout.write("\x1b[?25h");
	}

	clearLine(): void {
		process.stdout.write("\x1b[K");
	}

	clearFromCursor(): void {
		process.stdout.write("\x1b[J");
	}

	clearScreen(): void {
		process.stdout.write("\x1b[2J\x1b[H"); // Clear screen and move to home (1,1)
	}

	setTitle(title: string): void {
		// OSC 0;title BEL - set terminal window title
		process.stdout.write(`\x1b]0;${title}\x07`);
	}

	setProgress(active: boolean): void {
		if (active) {
			// OSC 9;4;3 - indeterminate progress
			process.stdout.write(TERMINAL_PROGRESS_ACTIVE_SEQUENCE);
			if (!this.progressInterval) {
				this.progressInterval = setInterval(() => {
					process.stdout.write(TERMINAL_PROGRESS_ACTIVE_SEQUENCE);
				}, TERMINAL_PROGRESS_KEEPALIVE_MS);
			}
		} else {
			this.clearProgressInterval();
			// OSC 9;4;0 - clear progress
			process.stdout.write(TERMINAL_PROGRESS_CLEAR_SEQUENCE);
		}
	}

	private clearProgressInterval(): boolean {
		if (!this.progressInterval) return false;
		clearInterval(this.progressInterval);
		this.progressInterval = undefined;
		return true;
	}
}
