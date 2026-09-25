import * as fs from "node:fs";
import * as path from "node:path";
import { performance } from "node:perf_hooks";
import { debugResize } from "./terminal.ts";
import { deleteKittyImage, isImageLine, joinedLinePayloadHasImages } from "./terminal-image.ts";
import { type TUI, TuiBase, type TuiStopOptions } from "./tui.ts";
import { truncateToWidth, visibleWidth } from "./utils.ts";

const KITTY_SEQUENCE_PREFIX = "\x1b_G";
const MAX_RENDER_WRITE_CHARS = 1024 * 1024;
const FIRST_FRAME_WAIT_MS = 250;
const FIRST_FRAME_POLL_MS = 40;

/**
 * Streams terminal output in 1 MiB chunks so a full render never forms one string large enough to exceed V8's limit.
 *
 * `append()` fills the current chunk and flushes it when full. Oversized input is split at chunk boundaries, preserving
 * surrogate pairs so each write remains valid UTF-16. Callers append synchronized-output begin/end sequences themselves;
 * the final `flush()` writes any remainder, including the end sequence.
 */
class BoundedTerminalWriter {
	private buffer = "";
	private writtenChars = 0;
	private readonly write: (data: string) => void;

	constructor(write: (data: string) => void) {
		this.write = write;
	}

	/**
	 * Append terminal data, flushing full chunks as needed. Callers must call `flush()` after the final append.
	 * @param value Terminal data to write in order; oversized values are split without splitting surrogate pairs.
	 */
	append(value: string): void {
		let offset = 0;
		while (offset < value.length) {
			const capacity = MAX_RENDER_WRITE_CHARS - this.buffer.length;
			if (capacity === 0) {
				this.flush();
				continue;
			}

			let end = Math.min(value.length, offset + capacity);
			if (
				end < value.length &&
				value.charCodeAt(end - 1) >= 0xd800 &&
				value.charCodeAt(end - 1) <= 0xdbff &&
				value.charCodeAt(end) >= 0xdc00 &&
				value.charCodeAt(end) <= 0xdfff
			) {
				end--;
			}
			if (end === offset) {
				this.flush();
				continue;
			}

			this.buffer += value.slice(offset, end);
			offset = end;
			if (this.buffer.length === MAX_RENDER_WRITE_CHARS) {
				this.flush();
			}
		}
	}

	/** Write the current chunk, if any, and retain only its character count for debug output. */
	flush(): void {
		if (!this.buffer) return;
		this.write(this.buffer);
		this.writtenChars += this.buffer.length;
		this.buffer = "";
	}

	get length(): number {
		return this.writtenChars + this.buffer.length;
	}
}

interface KittyImageHeader {
	ids: number[];
	rows: number;
}

function parseKittyImageHeader(line: string): KittyImageHeader | undefined {
	const sequenceStart = line.indexOf(KITTY_SEQUENCE_PREFIX);
	if (sequenceStart === -1) return undefined;
	const paramsStart = sequenceStart + KITTY_SEQUENCE_PREFIX.length;
	const paramsEnd = line.indexOf(";", paramsStart);
	if (paramsEnd === -1) return undefined;

	const ids: number[] = [];
	let rows = 1;
	for (const param of line.slice(paramsStart, paramsEnd).split(",")) {
		const [key, value] = param.split("=", 2);
		if (value === undefined) continue;
		const numberValue = Number(value);
		if (!Number.isInteger(numberValue) || numberValue <= 0 || numberValue > 0xffffffff) continue;
		if (key === "i") ids.push(numberValue);
		else if (key === "r") rows = numberValue;
	}
	return { ids, rows };
}

function extractKittyImageIds(line: string): number[] {
	return parseKittyImageHeader(line)?.ids ?? [];
}

function extractKittyImageRows(line: string): number {
	return parseKittyImageHeader(line)?.rows ?? 1;
}

/** Whether any line in the range carries a kitty or iTerm2 image sequence. */
function rangeHasImageLine(lines: readonly string[], from: number, to: number): boolean {
	const end = Math.min(to, lines.length - 1);
	for (let index = Math.max(0, from); index <= end; index++) {
		if (isImageLine(lines[index])) return true;
	}
	return false;
}

function isTermuxSession(): boolean {
	return Boolean(process.env.TERMUX_VERSION);
}

export interface TuiMainScreenRenderState {
	previousLines: string[];
	previousFirstLine: number;
	previousTotalLines: number;
	previousWidth: number;
	previousHeight: number;
	cursorRow: number;
	hardwareCursorRow: number;
	maxLinesRendered: number;
	previousViewportTop: number;
}

/** TUI implementation that renders into the terminal's main screen and scrollback. */
export class TuiMainScreen extends TuiBase implements TUI {
	readonly mode = "regular" as const;
	private previousLines: string[] = [];
	private previousFirstLine = 0;
	private previousTotalLines = 0;
	private previousKittyImageIds = new Set<number>();
	private knownKittyImageIds = new Set<number>();
	private previousWidth = 0;
	private previousHeight = 0;
	private cursorRow = 0;
	private hardwareCursorRow = 0;
	private maxLinesRendered = 0;
	private previousViewportTop = 0;
	private painting = false;
	private renderAfterPaint = false;
	private firstFrameDeadline = 0;
	private viewportRepaintRequested = false;
	private paintLinesAbove = 0;
	private paintTotal = 0;
	private paintFrozenLines: string[] = [];
	private paintRenderedTotal = 0;
	private paintRegionBottom = 0;
	private paintWidth = 0;
	private paintHeight = 0;
	private repaintMarkCount = 0;
	private paintRing: string[] = [];
	private paintRingStart = 0;
	private paintRingCapacity = 0;

	captureRenderState(): TuiMainScreenRenderState {
		return {
			previousLines: [...this.previousLines],
			previousFirstLine: this.previousFirstLine,
			previousTotalLines: this.previousTotalLines,
			previousWidth: this.previousWidth,
			previousHeight: this.previousHeight,
			cursorRow: this.cursorRow,
			hardwareCursorRow: this.hardwareCursorRow,
			maxLinesRendered: this.maxLinesRendered,
			previousViewportTop: this.previousViewportTop,
		};
	}

	restoreRenderState(state: TuiMainScreenRenderState): void {
		this.previousLines = state.previousLines.map((line) => (isImageLine(line) ? "" : line));
		this.previousFirstLine = state.previousFirstLine;
		this.previousTotalLines = state.previousTotalLines;
		this.previousKittyImageIds = new Set();
		this.previousWidth = state.previousWidth;
		this.previousHeight = state.previousHeight;
		this.cursorRow = state.cursorRow;
		this.hardwareCursorRow = state.hardwareCursorRow;
		this.maxLinesRendered = state.maxLinesRendered;
		this.previousViewportTop = state.previousViewportTop;
	}

	protected override resetRenderState(): void {
		this.previousLines = [];
		this.previousFirstLine = 0;
		this.previousTotalLines = 0;
		this.cursorRow = 0;
		this.hardwareCursorRow = 0;
		this.maxLinesRendered = 0;
		this.previousViewportTop = 0;
		this.viewportRepaintRequested = true;
	}

	protected override beforeTerminalStop(options: TuiStopOptions): void {
		if (options.preserveScreen || this.previousTotalLines === 0) return;
		this.terminal.write(" ");
		const targetRow = this.previousTotalLines;
		const lineDiff = targetRow - this.hardwareCursorRow;
		if (lineDiff > 0) this.terminal.write(`\x1b[${lineDiff}B`);
		else if (lineDiff < 0) this.terminal.write(`\x1b[${-lineDiff}A`);
		this.terminal.write("\r\n");
	}

	private collectKittyImageIds(lines: string[]): Set<number> {
		const ids = new Set<number>();
		for (const line of lines) {
			for (const id of extractKittyImageIds(line)) {
				ids.add(id);
			}
		}
		return ids;
	}

	private deleteKittyImages(ids: Set<number>): string {
		let buffer = "";
		for (const id of ids) {
			buffer += deleteKittyImage(id);
		}
		return buffer;
	}

	private getKittyImageReservedRows(lines: string[], index: number, maxIndex = lines.length - 1): number {
		const rows = extractKittyImageRows(lines[index] ?? "");
		if (rows <= 1) return 1;

		const maxRows = Math.min(rows, maxIndex - index + 1, lines.length - index);
		let reservedRows = 1;
		while (reservedRows < maxRows) {
			const line = lines[index + reservedRows] ?? "";
			if (isImageLine(line) || visibleWidth(line) > 0) break;
			reservedRows++;
		}
		return reservedRows;
	}

	private expandChangedRangeForKittyImages(
		firstChanged: number,
		lastChanged: number,
		newLines: string[],
		newStart: number,
	): { firstChanged: number; lastChanged: number } {
		if (
			this.previousKittyImageIds.size === 0 &&
			!rangeHasImageLine(newLines, firstChanged - newStart, lastChanged - newStart)
		) {
			return { firstChanged: firstChanged, lastChanged: lastChanged };
		}
		let expandedFirstChanged = firstChanged;
		let expandedLastChanged = lastChanged;
		const expandForLines = (lines: string[], lineStart: number): void => {
			for (let i = 0; i < lines.length; i++) {
				if (extractKittyImageIds(lines[i]).length === 0) continue;
				const lineIndex = lineStart + i;
				const blockEnd = lineIndex + this.getKittyImageReservedRows(lines, i) - 1;
				if (lineIndex >= firstChanged || (lineIndex <= lastChanged && blockEnd >= firstChanged)) {
					expandedFirstChanged = Math.min(expandedFirstChanged, lineIndex);
					expandedLastChanged = Math.max(expandedLastChanged, blockEnd);
				}
			}
		};

		expandForLines(this.previousLines, this.previousFirstLine);
		expandForLines(newLines, newStart);
		return { firstChanged: expandedFirstChanged, lastChanged: expandedLastChanged };
	}

	private deleteChangedKittyImages(firstChanged: number, lastChanged: number): string {
		if (firstChanged < 0 || lastChanged < firstChanged) return "";

		const ids = new Set<number>();
		const start = Math.max(firstChanged, this.previousFirstLine);
		const end = Math.min(lastChanged, this.previousTotalLines - 1);
		for (let i = start; i <= end; i++) {
			for (const id of extractKittyImageIds(this.previousLines[i - this.previousFirstLine] ?? "")) {
				ids.add(id);
			}
		}

		return this.deleteKittyImages(ids);
	}

	protected doRender(): void {
		if (this.stopped) return;
		this.renderFrame();
		this.writeRepaintMark();
	}

	/**
	 * Repaint stamp for PI_DEBUG_REDRAW=1: a reverse-video write counter at the
	 * top left corner that advances only when pi writes to the screen. The stamp
	 * stays until the next pi write, so a frozen counter means the screen
	 * changed without pi (the terminal's own redraw), which separates pi's
	 * writes from display-side corruption by eye.
	 */
	private writeRepaintMark(): void {
		if (process.env.PI_DEBUG_REDRAW !== "1") return;
		this.repaintMarkCount += 1;
		this.terminal.write(`\x1b7\x1b[1;1H\x1b[7mR${this.repaintMarkCount}:${this.terminal.columns()}\x1b[0m \x1b8`);
	}

	private renderFrame(): void {
		if (this.stopped) return;
		debugResize(
			`doRender painting=${this.painting} prevTotal=${this.previousTotalLines} width=${this.terminal.columns()}/${this.previousWidth} firstDeadline=${this.firstFrameDeadline}`,
		);
		if (this.painting) {
			if (this.terminal.columns() !== this.paintWidth || this.terminal.rows() !== this.paintHeight) {
				this.cancelTranscriptPaint();
			} else {
				this.renderAfterPaint = true;
				this.refreshPaintFrozenTail();
				return;
			}
		}
		if (this.previousTotalLines === 0 && !this.terminal.hasReportedWindowSize()) {
			if (this.firstFrameDeadline === 0) {
				this.firstFrameDeadline = performance.now() + FIRST_FRAME_WAIT_MS;
			}
			if (performance.now() < this.firstFrameDeadline) {
				setTimeout(() => this.requestRender(), FIRST_FRAME_POLL_MS);
				return;
			}
		}
		const width = this.terminal.columns();
		const height = this.terminal.rows();
		const widthChanged = this.previousWidth !== 0 && this.previousWidth !== width;
		const heightChanged = this.previousHeight !== 0 && this.previousHeight !== height;
		let prevViewportTop = heightChanged ? Math.max(0, this.previousTotalLines - height) : this.previousViewportTop;
		let viewportTop = prevViewportTop;
		let hardwareCursorRow = this.hardwareCursorRow;
		const computeLineDiff = (targetRow: number): number => {
			const currentScreenRow = hardwareCursorRow - prevViewportTop;
			const targetScreenRow = targetRow - viewportTop;
			return targetScreenRow - currentScreenRow;
		};

		// Render the tail window: the last blocks covering a couple of screens plus
		// the fixed components below the transcript. Everything above it stays
		// released, so a frame costs the window and nothing else.
		const budget = Math.max(height * 2, height + 16);
		const frame = this.renderWindow(width, budget);
		let newLines = frame.lines;
		const newStart = frame.linesAbove;
		const newTotal = newStart + newLines.length;

		// Composite overlays into the rendered lines (before differential compare)
		if (this.hasOverlayEntries) {
			newLines = this.compositeOverlays(newLines, width, height);
		}

		// Extract cursor position before applying line resets (marker must be found first)
		const cursorPos = this.extractCursorPosition(newLines, height, newStart);

		// Helper to clear scrollback and viewport and render all new lines
		const fullRender = (clear: boolean): void => {
			this.repaintTranscript(width, height, clear, cursorPos);
		};

		const debugRedraw = process.env.PI_DEBUG_REDRAW === "1";
		const logRedraw = (reason: string): void => {
			if (!debugRedraw) return;
			const logPath = path.join(this.logDirectory, "pi-redraw.log");
			const msg = `[${new Date().toISOString()}] redraw: ${reason} (prev=${this.previousLines.length}, new=${newLines.length}, height=${height})\n`;
			fs.mkdirSync(path.dirname(logPath), { recursive: true });
			fs.appendFileSync(logPath, msg);
		};

		const forceViewport = this.viewportRepaintRequested;
		this.viewportRepaintRequested = false;
		const forceTranscript = this.transcriptRepaintRequested;
		this.transcriptRepaintRequested = false;

		// First render - just output everything without clearing (assumes clean screen)
		if (
			this.previousLines.length === 0 &&
			!widthChanged &&
			!heightChanged &&
			frame.repaintFromLine < 0 &&
			!forceViewport
		) {
			logRedraw("first render");
			fullRender(false);
			return;
		}

		if (widthChanged) {
			logRedraw(`terminal width changed (${this.previousWidth} -> ${width})`);
			this.repaintViewport(width, height, newLines, newStart, newTotal, cursorPos);
			return;
		}

		// Height changes normally need a full re-render to keep the visible viewport aligned,
		// but Termux changes height when the software keyboard shows or hides.
		// In that environment, a full redraw causes the entire history to replay on every toggle.
		if (heightChanged && !isTermuxSession()) {
			logRedraw(`terminal height changed (${this.previousHeight} -> ${height})`);
			this.repaintViewport(width, height, newLines, newStart, newTotal, cursorPos);
			return;
		}

		// A caller asked for a repaint of the whole transcript (visibility toggle,
		// image settings, suspend resume): the scrollback content is stale.
		if (forceTranscript) {
			logRedraw("transcript repaint requested");
			fullRender(true);
			return;
		}

		// A forced redraw without a transcript change only needs the visible
		// window rewritten: drifting cursor bookkeeping can leave stale rows in
		// the viewport, but the scrollback above it is still valid.
		if (forceViewport) {
			if (frame.repaintFromLine >= 0) {
				logRedraw(`content above window changed (line ${frame.repaintFromLine})`);
				fullRender(true);
				return;
			}
			logRedraw("forced viewport repaint");
			this.repaintViewport(width, height, newLines, newStart, newTotal, cursorPos);
			return;
		}

		// Content shrunk below the working area and no overlays - re-render to clear empty rows
		// (overlays need the padding, so only do this when no overlays are active)
		// Configurable via setClearOnShrink() or PI_CLEAR_ON_SHRINK=0 env var
		if (this.getClearOnShrink() && newTotal < this.maxLinesRendered && !this.hasOverlayEntries) {
			logRedraw(`clearOnShrink (maxLinesRendered=${this.maxLinesRendered})`);
			fullRender(true);
			return;
		}

		// A block above the window changed after it was written. The terminal
		// holds the old lines in its scrollback, so only a full repaint can fix it.
		if (frame.repaintFromLine >= 0) {
			logRedraw(`content above window changed (line ${frame.repaintFromLine})`);
			fullRender(true);
			return;
		}

		// Find first and last changed lines, aligned by absolute line index.
		let firstChanged = -1;
		let lastChanged = -1;
		const prevStart = this.previousFirstLine;
		const prevLines = this.previousLines;
		const prevTotal = this.previousTotalLines;
		const compareFrom = Math.max(prevStart, newStart);
		const compareTo = Math.min(prevTotal, newTotal);
		for (let i = compareFrom; i < compareTo; i++) {
			const oldLine = prevLines[i - prevStart];
			const newLine = newLines[i - newStart];
			if (oldLine !== newLine) {
				if (firstChanged === -1) {
					firstChanged = i;
				}
				lastChanged = i;
			}
		}
		const appendedLines = newTotal > prevTotal;
		if (appendedLines) {
			if (firstChanged === -1) {
				firstChanged = Math.max(prevTotal, newStart);
			}
			lastChanged = newTotal - 1;
		}
		if (newTotal < prevTotal && firstChanged === -1) {
			firstChanged = newTotal;
			lastChanged = prevTotal - 1;
		}
		if (firstChanged !== -1) {
			const expandedRange = this.expandChangedRangeForKittyImages(firstChanged, lastChanged, newLines, newStart);
			firstChanged = expandedRange.firstChanged;
			lastChanged = expandedRange.lastChanged;
		}
		const appendStart = appendedLines && firstChanged === prevTotal && firstChanged > 0;

		// No changes - but still need to update hardware cursor position if it moved
		if (firstChanged === -1) {
			this.positionHardwareCursor(cursorPos, newTotal);
			this.previousViewportTop = prevViewportTop;
			this.previousLines = newLines;
			this.previousFirstLine = newStart;
			this.previousTotalLines = newTotal;
			this.previousKittyImageIds = this.collectKittyImageIds(newLines);
			this.previousWidth = width;
			this.previousHeight = height;
			return;
		}

		// All changes are in deleted lines (nothing to render, just clear)
		if (firstChanged >= newTotal) {
			if (prevTotal > newTotal) {
				const output = new BoundedTerminalWriter((data) => this.terminal.write(data));
				output.append("\x1b[?2026h");
				output.append(this.deleteChangedKittyImages(firstChanged, lastChanged));
				// Move to end of new content (clamp to 0 for empty content)
				const targetRow = Math.max(0, newTotal - 1);
				if (targetRow < prevViewportTop) {
					logRedraw(`deleted lines moved viewport up (${targetRow} < ${prevViewportTop})`);
					fullRender(true);
					return;
				}
				const lineDiff = computeLineDiff(targetRow);
				if (lineDiff > 0) output.append(`\x1b[${lineDiff}B`);
				else if (lineDiff < 0) output.append(`\x1b[${-lineDiff}A`);
				output.append("\r");
				// Clear extra lines without scrolling
				const extraLines = prevTotal - newTotal;
				if (extraLines > height) {
					logRedraw(`extraLines > height (${extraLines} > ${height})`);
					fullRender(true);
					return;
				}
				const clearStartOffset = newTotal === 0 ? 0 : 1;
				if (extraLines > 0 && clearStartOffset > 0) {
					output.append(`\x1b[${clearStartOffset}B`);
				}
				for (let i = 0; i < extraLines; i++) {
					output.append("\r\x1b[2K");
					if (i < extraLines - 1) output.append("\x1b[1B");
				}
				const moveBack = Math.max(0, extraLines - 1 + clearStartOffset);
				if (moveBack > 0) {
					output.append(`\x1b[${moveBack}A`);
				}
				output.append("\x1b[?2026l");
				output.flush();
				this.cursorRow = targetRow;
				this.hardwareCursorRow = targetRow;
			}
			this.positionHardwareCursor(cursorPos, newTotal);
			this.previousLines = newLines;
			this.previousFirstLine = newStart;
			this.previousTotalLines = newTotal;
			this.previousKittyImageIds = this.collectKittyImageIds(newLines);
			this.previousWidth = width;
			this.previousHeight = height;
			this.previousViewportTop = prevViewportTop;
			return;
		}

		// Differential rendering can only touch what was actually visible.
		// If the first changed line is above the previous viewport, we need a full redraw.
		if (firstChanged < prevViewportTop) {
			logRedraw(`firstChanged < viewportTop (${firstChanged} < ${prevViewportTop})`);
			fullRender(true);
			return;
		}

		// Render from first changed line to end
		// Keep updates wrapped in synchronized output while writing bounded chunks.
		const output = new BoundedTerminalWriter((data) => this.terminal.write(data));
		output.append("\x1b[?2026h"); // Begin synchronized output
		output.append(this.deleteChangedKittyImages(firstChanged, lastChanged));
		const prevViewportBottom = prevViewportTop + height - 1;
		const moveTargetRow = appendStart ? firstChanged - 1 : firstChanged;
		if (moveTargetRow > prevViewportBottom) {
			const currentScreenRow = Math.max(0, Math.min(height - 1, hardwareCursorRow - prevViewportTop));
			const moveToBottom = height - 1 - currentScreenRow;
			if (moveToBottom > 0) {
				output.append(`\x1b[${moveToBottom}B`);
			}
			const scroll = moveTargetRow - prevViewportBottom;
			output.append("\r\n".repeat(scroll));
			prevViewportTop += scroll;
			viewportTop += scroll;
			hardwareCursorRow = moveTargetRow;
		}

		// Move cursor to first changed line (use hardwareCursorRow for actual position)
		const lineDiff = computeLineDiff(moveTargetRow);
		if (lineDiff > 0) {
			output.append(`\x1b[${lineDiff}B`); // Move down
		} else if (lineDiff < 0) {
			output.append(`\x1b[${-lineDiff}A`); // Move up
		}

		output.append(appendStart ? "\r\n" : "\r"); // Move to column 0

		// Only render changed lines (firstChanged to lastChanged), not all lines to end
		// This reduces flicker when only a single line changes (e.g., spinner animation)
		const renderEnd = Math.min(lastChanged, newTotal - 1);
		for (let i = firstChanged; i <= renderEnd; i++) {
			if (i > firstChanged) output.append("\r\n");
			const rawLine = newLines[i - newStart];
			const line = this.resetLine(rawLine);
			const isImage = isImageLine(rawLine);
			const imageReservedRows = isImage
				? this.getKittyImageReservedRows(newLines, i - newStart, renderEnd - newStart)
				: 1;
			if (imageReservedRows > 1) {
				const imageStartScreenRow = i - viewportTop;
				if (imageStartScreenRow < 0 || imageStartScreenRow + imageReservedRows > height) {
					logRedraw(
						`kitty image pre-clear would scroll (${imageStartScreenRow} + ${imageReservedRows} > ${height})`,
					);
					fullRender(true);
					return;
				}

				output.append("\x1b[2K");
				for (let row = 1; row < imageReservedRows; row++) {
					output.append("\r\n\x1b[2K");
				}
				output.append(`\x1b[${imageReservedRows - 1}A`);
				output.append(line);
				output.append(`\x1b[${imageReservedRows - 1}B`);
				i += imageReservedRows - 1;
				continue;
			}

			output.append("\x1b[2K"); // Clear current line
			if (!isImage && visibleWidth(line) > width) {
				// Log the over-wide line to the crash file for diagnostics, then clip
				// it to the terminal width instead of aborting the session. A layout
				// pass can mis-reserve columns for non-BMP characters (the static
				// string decode splits surrogate pairs), and a one-column overflow
				// must not kill the whole TUI.
				const crashLogPath = path.join(this.logDirectory, "pi-crash.log");
				const crashData = [
					`Clipped at ${new Date().toISOString()}`,
					`Terminal width: ${width}`,
					`Line ${i} visible width: ${visibleWidth(line)}`,
					"",
					"=== All rendered lines ===",
					...newLines.map((l, idx) => `[${idx}] (w=${visibleWidth(l)}) ${l}`),
					"",
				].join("\n");
				fs.mkdirSync(path.dirname(crashLogPath), { recursive: true });
				fs.writeFileSync(crashLogPath, crashData);

				output.append(truncateToWidth(line, width, ""));
			} else {
				output.append(isImage ? line : truncateToWidth(line, width, ""));
			}
		}

		// Track where cursor ended up after rendering
		let finalCursorRow = renderEnd;

		// If we had more lines before, clear them and move cursor back
		if (prevTotal > newTotal) {
			// Move to end of new content first if we stopped before it
			if (renderEnd < newTotal - 1) {
				const moveDown = newTotal - 1 - renderEnd;
				output.append(`\x1b[${moveDown}B`);
				finalCursorRow = newTotal - 1;
			}
			const extraLines = prevTotal - newTotal;
			for (let i = newTotal; i < prevTotal; i++) {
				output.append("\r\n\x1b[2K");
			}
			// Move cursor back to end of new content
			output.append(`\x1b[${extraLines}A`);
		}

		output.append("\x1b[?2026l"); // End synchronized output

		if (process.env.PI_TUI_DEBUG === "1") {
			const debugDir = "/tmp/tui";
			fs.mkdirSync(debugDir, { recursive: true });
			const debugPath = path.join(debugDir, `render-${Date.now()}.log`);
			const debugData = [
				`firstChanged: ${firstChanged}`,
				`viewportTop: ${viewportTop}`,
				`cursorRow: ${this.cursorRow}`,
				`height: ${height}`,
				`lineDiff: ${lineDiff}`,
				`hardwareCursorRow: ${hardwareCursorRow}`,
				`renderEnd: ${renderEnd}`,
				`finalCursorRow: ${finalCursorRow}`,
				`cursorPos: ${JSON.stringify(cursorPos)}`,
				`newLines.length: ${newLines.length}`,
				`previousLines.length: ${this.previousLines.length}`,
				`newStart: ${newStart}`,
				`newTotal: ${newTotal}`,
				"",
				"=== newLines ===",
				JSON.stringify(newLines, null, 2),
				"",
				"=== previousLines ===",
				JSON.stringify(this.previousLines, null, 2),
				"",
				"=== buffer ===",
				`[${output.length} chars written in bounded chunks]`,
			].join("\n");
			fs.writeFileSync(debugPath, debugData);
		}

		output.flush();

		// Track cursor position for next render
		// cursorRow tracks end of content (for viewport calculation)
		// hardwareCursorRow tracks actual terminal cursor position (for movement)
		this.cursorRow = Math.max(0, newTotal - 1);
		this.hardwareCursorRow = finalCursorRow;
		// Track terminal's working area (grows but doesn't shrink unless cleared)
		this.maxLinesRendered = Math.max(this.maxLinesRendered, newTotal);
		this.previousViewportTop = Math.max(prevViewportTop, finalCursorRow - height + 1);

		// Position hardware cursor for IME
		this.positionHardwareCursor(cursorPos, newTotal);

		this.previousLines = newLines;
		this.previousFirstLine = newStart;
		this.previousTotalLines = newTotal;
		this.previousKittyImageIds = this.collectKittyImageIds(newLines);
		this.previousWidth = width;
		this.previousHeight = height;
	}

	/**
	 * Rewrite the frozen tail of an open transcript paint in place when its
	 * rendered lines changed, so spinners and status text stay live while the
	 * fill streams above. Only rows below the scroll region are touched and the
	 * cursor is saved and restored around the write, so the fill stream keeps
	 * writing from its own position. Skipped when the tree height differs from
	 * the height recorded at paint open, because the scroll region boundary
	 * cannot move mid-paint.
	 */
	private refreshPaintFrozenTail(): void {
		const frozenLines = this.paintFrozenLines;
		const frozenCount = frozenLines.length;
		if (frozenCount === 0) return;
		const width = this.terminal.columns();
		const rendered = this.render(width);
		if (rendered.length !== this.paintRenderedTotal) return;
		if (rendered.length < frozenCount) return;
		const tailLines = rendered.slice(rendered.length - frozenCount);
		if (tailLines.length !== frozenCount) return;
		let firstChanged = -1;
		let lastChanged = -1;
		for (let i = 0; i < frozenCount; i++) {
			const line = tailLines[i];
			if (line !== frozenLines[i]) {
				if (isImageLine(line) || isImageLine(frozenLines[i])) continue;
				if (firstChanged === -1) firstChanged = i;
				lastChanged = i;
			}
		}
		if (firstChanged === -1 || lastChanged < firstChanged) return;

		const regionBottom = this.paintRegionBottom;
		const output = new BoundedTerminalWriter((data) => this.terminal.write(data));
		output.append("\x1b[?2026h");
		output.append("\x1b7");
		for (let i = firstChanged; i <= lastChanged; i++) {
			const line = tailLines[i];
			if (line === frozenLines[i] || isImageLine(line)) continue;
			output.append(`\x1b[${regionBottom + 1 + i};1H`);
			output.append("\x1b[2K");
			output.append(this.frozenLineWrite(line, width));
			frozenLines[i] = line;
		}
		output.append("\x1b8");
		output.append("\x1b[?2026l");
		output.flush();
		this.writeRepaintMark();
	}

	/**
	 * Write one batch of lines, handling kitty image reserved rows. Batches are
	 * joined with CRLF so the whole batch is one native append.
	 */
	private writeLineBatch(
		output: BoundedTerminalWriter,
		lines: string[],
		height: number,
		width: number,
		leadingNewline: boolean,
	): void {
		const writeLines = lines.map((line) => {
			const reset = this.resetLine(line);
			if (isImageLine(line)) return reset;
			return truncateToWidth(reset, width, "");
		});
		const joined = writeLines.join("\r\n");
		if (joinedLinePayloadHasImages(joined)) {
			for (let i = 0; i < writeLines.length; i++) {
				if (leadingNewline || i > 0) output.append("\r\n");
				const line = writeLines[i];
				for (const id of extractKittyImageIds(lines[i])) {
					this.knownKittyImageIds.add(id);
				}
				const isImage = isImageLine(line);
				const imageReservedRows = isImage ? this.getKittyImageReservedRows(writeLines, i) : 1;
				if (imageReservedRows > 1 && imageReservedRows <= height) {
					for (let row = 1; row < imageReservedRows; row++) {
						output.append("\r\n");
					}
					output.append(`\x1b[${imageReservedRows - 1}A`);
					output.append(line);
					output.append(`\x1b[${imageReservedRows - 1}B`);
					i += imageReservedRows - 1;
					continue;
				}
				output.append(line);
			}
			return;
		}
		if (leadingNewline) output.append("\r\n");
		output.append(joined);
	}

	/**
	 * Repaint the whole render tree into the terminal, streaming every block and
	 * releasing the caches of everything above the tail window. Memory stays
	 * bounded by the largest block plus the retained window.
	 */
	private repaintTranscript(
		width: number,
		height: number,
		clear: boolean,
		cursorPos: { row: number; col: number } | null,
	): void {
		this.fullRedrawCount += 1;
		const output = new BoundedTerminalWriter((data) => this.terminal.write(data));
		output.append("\x1b[?2026h"); // Begin synchronized output
		if (clear) {
			output.append(this.deleteKittyImages(this.knownKittyImageIds));
			this.knownKittyImageIds = new Set<number>();
			output.append("\x1b[2J\x1b[H\x1b[3J"); // Clear screen, home, then clear scrollback
		}

		const total = this.measure(width);
		const budget = Math.max(height * 2, height + 16);
		const tailStart = Math.max(0, total - budget);
		const tail: string[] = [];
		let written = 0;
		let firstBatch = true;
		this.streamLines(width, (component, lines) => {
			if (lines.length === 0) return;
			this.writeLineBatch(output, lines, height, width, !firstBatch);
			firstBatch = false;
			if (written + lines.length <= tailStart) {
				component.releaseLines();
			}
			written += lines.length;
			for (let i = 0; i < lines.length; i++) {
				tail.push(lines[i]);
			}
			if (tail.length > budget * 2) {
				tail.splice(0, tail.length - budget);
			}
		});
		output.append("\x1b[?2026l"); // End synchronized output
		output.flush();

		const kept = Math.min(tail.length, budget);
		const keptLines = kept >= tail.length ? tail : tail.slice(tail.length - kept);
		this.previousLines = keptLines;
		this.previousFirstLine = Math.max(0, written - keptLines.length);
		this.previousTotalLines = written;
		this.cursorRow = Math.max(0, written - 1);
		this.hardwareCursorRow = this.cursorRow;
		this.maxLinesRendered = clear ? written : Math.max(this.maxLinesRendered, written);
		this.previousViewportTop = Math.max(0, written - height);
		this.previousKittyImageIds = this.collectKittyImageIds(keptLines);
		this.previousWidth = width;
		this.previousHeight = height;
		this.positionHardwareCursor(cursorPos, written);
	}

	/**
	 * Rewrite only the visible lines of the frame from the top row down, and
	 * adopt the frame as the baseline. The top anchor matches the differential
	 * renderer's line-index coordinates for every content height, so the
	 * hardware cursor bookkeeping cannot drift into a second stale copy of a
	 * short frame. Cheap enough for every forced redraw and it cannot leave
	 * stale rows inside the viewport.
	 */
	private repaintViewport(
		width: number,
		height: number,
		lines: string[],
		lineStart: number,
		total: number,
		cursorPos: { row: number; col: number } | null,
	): void {
		const output = new BoundedTerminalWriter((data) => this.terminal.write(data));
		output.append("\x1b[?2026h");
		output.append("\x1b[1;1H");
		const viewportStart = Math.max(lineStart, total - height);
		for (let i = viewportStart; i < total; i++) {
			if (i > viewportStart) output.append("\r\n");
			const rawLine = lines[i - lineStart];
			const isImage = isImageLine(rawLine);
			if (!isImage) output.append("\x1b[2K");
			const line = this.resetLine(rawLine);
			if (!isImage) {
				output.append(truncateToWidth(line, width, ""));
			} else {
				output.append(line);
			}
		}
		const writtenRows = total - viewportStart;
		if (writtenRows < height) {
			output.append(`\x1b[${writtenRows + 1};1H\x1b[0J`);
		}
		output.append("\x1b[?2026l");
		output.flush();

		this.previousLines = lines;
		this.previousFirstLine = lineStart;
		this.previousTotalLines = total;
		this.previousViewportTop = Math.max(0, total - height);
		this.cursorRow = Math.max(0, total - 1);
		this.hardwareCursorRow = this.cursorRow;
		this.maxLinesRendered = Math.max(this.maxLinesRendered, total);
		this.previousKittyImageIds = this.collectKittyImageIds(lines);
		this.previousWidth = width;
		this.previousHeight = height;
		this.positionHardwareCursor(cursorPos, total);
	}

	/**
	 * Write payload for one frozen tail line: the terminal reset form of the
	 * line, clipped to the terminal width so an over-wide line cannot wrap into
	 * the frozen row below it.
	 * @param line Rendered line to write
	 * @param width Terminal width in columns
	 * @returns Terminal sequences for the line content
	 */
	private frozenLineWrite(line: string, width: number): string {
		const reset = this.resetLine(line);
		if (isImageLine(line)) return reset;
		return truncateToWidth(reset, width, "");
	}

	/**
	 * Open a streaming paint of transcript content into the scrollback while a
	 * frozen tail of `frozenRows` screen rows stays in place. The frozen tail is
	 * written to its screen rows in place first, so the paint never depends on a
	 * previous frame having painted it. Painted lines then go above that tail;
	 * the terminal scrolls its region and keeps the scrolled out lines in the
	 * scrollback in order.
	 * @param frozenRows Screen rows at the bottom that must not be touched
	 * @param linesAbove Lines of the buffer above the painted region
	 * @param frozenTailLines Lines of the frozen tail, in order from the top row
	 */
	beginTranscriptPaint(frozenRows: number, linesAbove: number, frozenTailLines: string[]): void {
		debugResize(`beginTranscriptPaint rows=${frozenRows} painting=${this.painting}`);
		const height = this.terminal.rows();
		const width = this.terminal.columns();
		const regionBottom = Math.max(1, height - frozenRows);
		this.painting = true;
		this.paintWidth = width;
		this.paintHeight = height;
		this.paintLinesAbove = linesAbove;
		this.paintTotal = 0;
		this.paintRenderedTotal = this.render(width).length;
		this.paintFrozenLines = [...frozenTailLines];
		this.paintRegionBottom = regionBottom;
		this.paintRing = [];
		this.paintRingStart = 0;
		this.paintRingCapacity = Math.max(height * 2, height + 16);
		this.terminal.write("\x1b[?2026h");
		for (let i = 0; i < frozenRows; i++) {
			const line = i < frozenTailLines.length ? frozenTailLines[i] : "";
			this.terminal.write(`\x1b[${regionBottom + 1 + i};1H`);
			if (!isImageLine(line)) this.terminal.write("\x1b[2K");
			this.terminal.write(this.frozenLineWrite(line, width));
		}
		this.terminal.write(`\x1b[1;${regionBottom}r`);
		this.terminal.write(`\x1b[${regionBottom};1H`);
	}

	/** Append rendered transcript lines to the open paint. */
	paintTranscriptLines(lines: string[]): void {
		if (!this.painting || lines.length === 0) return;
		const output = new BoundedTerminalWriter((data) => this.terminal.write(data));
		this.writeLineBatch(output, lines, this.terminal.rows(), this.terminal.columns(), true);
		output.flush();
		for (let i = 0; i < lines.length; i++) {
			this.appendPaintRing(lines[i]);
		}
		this.paintTotal += lines.length;
		this.writeRepaintMark();
	}

	private appendPaintRing(line: string): void {
		if (this.paintRing.length < this.paintRingCapacity) {
			this.paintRing.push(line);
			return;
		}
		this.paintRing[this.paintRingStart] = line;
		this.paintRingStart += 1;
		if (this.paintRingStart >= this.paintRingCapacity) {
			this.paintRingStart = 0;
		}
	}

	/**
	 * Close the paint and adopt what is now on screen as the differential
	 * baseline: the newest painted lines plus the frozen tail lines below them.
	 * @param frozenTailLines Lines of the frozen tail, in order
	 */
	endTranscriptPaint(): void {
		debugResize(`endTranscriptPaint painting=${this.painting}`);
		if (!this.painting) return;
		this.painting = false;
		const width = this.terminal.columns();
		const height = this.terminal.rows();
		const frozenTailLines = this.paintFrozenLines;
		this.terminal.write("\x1b[r");
		this.terminal.write("\x1b[?2026l");

		const capacity = this.paintRingCapacity;
		const kept: string[] = [];
		if (this.paintRing.length < capacity) {
			for (let i = 0; i < this.paintRing.length; i++) {
				kept.push(this.paintRing[i]);
			}
		} else {
			for (let i = 0; i < capacity; i++) {
				kept.push(this.paintRing[(this.paintRingStart + i) % capacity]);
			}
		}
		for (let i = 0; i < frozenTailLines.length; i++) {
			kept.push(frozenTailLines[i]);
		}

		this.previousLines = kept;
		this.previousFirstLine = Math.max(
			0,
			this.paintLinesAbove + this.paintTotal - (kept.length - frozenTailLines.length),
		);
		this.previousTotalLines = this.paintLinesAbove + this.paintTotal + frozenTailLines.length;
		this.cursorRow = Math.max(0, this.previousTotalLines - 1);
		this.hardwareCursorRow = Math.max(0, this.paintLinesAbove + this.paintTotal - 1);
		this.maxLinesRendered = Math.max(this.maxLinesRendered, this.previousTotalLines);
		this.previousViewportTop = Math.max(0, this.previousTotalLines - height);
		this.previousKittyImageIds = this.collectKittyImageIds(kept);
		this.previousWidth = width;
		this.previousHeight = height;
		this.paintRing = [];
		this.paintFrozenLines = [];
		if (this.renderAfterPaint) {
			this.renderAfterPaint = false;
			this.requestRender();
		}
	}

	/** Abort an open paint, leaving the render state cold so the next frame repaints. */
	cancelTranscriptPaint(): void {
		if (!this.painting) return;
		this.painting = false;
		this.paintRing = [];
		this.terminal.write("\x1b[r");
		this.terminal.write("\x1b[?2026l");
		this.previousLines = [];
		this.previousFirstLine = 0;
		this.previousTotalLines = 0;
	}

	/**
	 * Position the hardware cursor for IME candidate window.
	 * @param cursorPos The cursor position extracted from rendered output, or null
	 * @param totalLines Total number of rendered lines
	 */
	private positionHardwareCursor(cursorPos: { row: number; col: number } | null, totalLines: number): void {
		if (!cursorPos || totalLines <= 0) {
			this.terminal.hideCursor();
			return;
		}

		// Clamp cursor position to valid range
		const targetRow = Math.max(0, Math.min(cursorPos.row, totalLines - 1));
		const targetCol = Math.max(0, cursorPos.col);

		// Move cursor from current position to target
		const rowDelta = targetRow - this.hardwareCursorRow;
		let buffer = "";
		if (rowDelta > 0) {
			buffer += `\x1b[${rowDelta}B`; // Move down
		} else if (rowDelta < 0) {
			buffer += `\x1b[${-rowDelta}A`; // Move up
		}
		// Move to absolute column (1-indexed)
		buffer += `\x1b[${targetCol + 1}G`;

		if (buffer) {
			this.terminal.write(buffer);
		}

		this.hardwareCursorRow = targetRow;
		if (this.getShowHardwareCursor()) {
			this.terminal.showCursor();
		} else {
			this.terminal.hideCursor();
		}
	}
}
