import { type ExecFileSyncOptionsWithStringEncoding, execFileSync, execSync } from "child_process";
import { randomUUID } from "crypto";
import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { platform, tmpdir } from "os";
import { join } from "path";
import { clipboard } from "./clipboard-native.ts";

function isWaylandSession(env: NodeJS.ProcessEnv = process.env): boolean {
	return Boolean(env.WAYLAND_DISPLAY) || env.XDG_SESSION_TYPE === "wayland";
}

function copyToX11Clipboard(text: string): void {
	try {
		execSync("xclip -selection clipboard", { input: text, timeout: 5000, stdio: ["pipe", "ignore", "ignore"] });
	} catch {
		execSync("xsel --clipboard --input", { input: text, timeout: 5000, stdio: ["pipe", "ignore", "ignore"] });
	}
}

const MAX_OSC52_ENCODED_LENGTH = 100_000;

function isRemoteSession(env: NodeJS.ProcessEnv = process.env): boolean {
	return Boolean(env.SSH_CONNECTION || env.SSH_CLIENT || env.MOSH_CONNECTION);
}

function isWslSession(env: NodeJS.ProcessEnv = process.env): boolean {
	if (env.WSL_DISTRO_NAME || env.WSLENV) {
		return true;
	}
	try {
		const release = readFileSync("/proc/version", "utf8");
		return /microsoft|wsl/i.test(release);
	} catch {
		return false;
	}
}

function emitOsc52(text: string): boolean {
	const encoded = Buffer.from(text).toString("base64");
	if (encoded.length > MAX_OSC52_ENCODED_LENGTH) {
		return false;
	}
	process.stdout.write(`\x1b]52;c;${encoded}\x07`);
	return true;
}

/** WSL without WSLg has no Linux display, so the Windows clipboard is written through interop. */
function copyViaWindowsClipboard(text: string): boolean {
	const tempPath = join(tmpdir(), `pi-wsl-clip-${randomUUID()}.txt`);
	try {
		writeFileSync(tempPath, text);
		const winPath = execFileSync("wslpath", ["-w", tempPath], { encoding: "utf8", timeout: 1000 }).trim();
		if (!winPath) {
			return false;
		}
		const escapedPath = winPath.split("'").join("''");
		const script = `Set-Clipboard -Value ([System.IO.File]::ReadAllText('${escapedPath}', [System.Text.Encoding]::UTF8))`;
		execFileSync("powershell.exe", ["-NoProfile", "-Command", script], {
			encoding: "utf8",
			timeout: 5000,
			stdio: ["ignore", "ignore", "ignore"],
		});
		return true;
	} catch {
		return false;
	} finally {
		try {
			unlinkSync(tempPath);
		} catch {
		}
	}
}

type ClipboardReadResult = { ok: true; text: string | null } | { ok: false };

interface ClipboardReadAttempt {
	command: string;
	args: string[];
}

const READ_CLIPBOARD_OPTIONS: ExecFileSyncOptionsWithStringEncoding = {
	encoding: "utf8",
	maxBuffer: 50 * 1024 * 1024,
	timeout: 5000,
};

function readClipboardCommand(command: string, args: string[]): ClipboardReadResult {
	try {
		const text = execFileSync(command, args, READ_CLIPBOARD_OPTIONS);
		return { ok: true, text: text || null };
	} catch {
		return { ok: false };
	}
}

/** Read plain text from the system clipboard. */
export async function readClipboardText(): Promise<string | null> {
	if (platform() === "linux") {
		const attempts: ClipboardReadAttempt[] = [];
		if (process.env.TERMUX_VERSION) {
			attempts.push({ command: "termux-clipboard-get", args: [] });
		}
		if (process.env.WAYLAND_DISPLAY) {
			attempts.push({ command: "wl-paste", args: ["--no-newline", "--type", "text"] });
		}
		if (process.env.DISPLAY) {
			attempts.push({ command: "xclip", args: ["-selection", "clipboard", "-out"] });
			attempts.push({ command: "xsel", args: ["--clipboard", "--output"] });
		}
		for (const attempt of attempts) {
			const result = readClipboardCommand(attempt.command, attempt.args);
			if (result.ok) {
				return result.text;
			}
		}
	}

	if (!clipboard) {
		return null;
	}

	try {
		const text = await clipboard.getText();
		return text || null;
	} catch {
		return null;
	}
}

/**
 * Copy text to the system clipboard.
 *
 * Direct writes precede OSC 52 so the terminal cannot race a native writer, and Linux
 * tools keep clipboard selection ownership after the call returns. OSC 52 cannot be
 * verified, so a desktop session with a display reports failure instead of a false
 * success. Without a display the terminal is the only clipboard route, and remote
 * sessions always emit it to reach the client clipboard.
 */
export async function copyToClipboard(text: string): Promise<void> {
	const p = platform();
	const env = process.env;
	let copied = false;

	try {
		if (clipboard && p !== "linux") {
			await clipboard.setText(text);
			copied = true;
		}
	} catch {
	}

	if (!copied) {
		try {
			if (p === "darwin") {
				execSync("pbcopy", { input: text, timeout: 5000, stdio: ["pipe", "ignore", "ignore"] });
				copied = true;
			} else if (p === "win32") {
				execSync("clip", { input: text, timeout: 5000, stdio: ["pipe", "ignore", "ignore"] });
				copied = true;
			} else {
				if (env.TERMUX_VERSION) {
					try {
						execSync("termux-clipboard-set", {
							input: text,
							timeout: 5000,
							stdio: ["pipe", "ignore", "ignore"],
						});
						copied = true;
					} catch {
					}
				}

				if (!copied && isWaylandSession(env) && env.WAYLAND_DISPLAY) {
					try {
						execSync("which wl-copy", { stdio: "ignore" });
						execSync("wl-copy", { input: text, timeout: 5000, stdio: ["pipe", "ignore", "ignore"] });
						copied = true;
					} catch {
					}
				}

				if (!copied && env.DISPLAY) {
					copyToX11Clipboard(text);
					copied = true;
				}
			}
		} catch {
		}
	}

	let osc52Emitted = false;
	if (!copied && p === "linux" && isWslSession(env)) {
		if (env.WT_SESSION) {
			osc52Emitted = emitOsc52(text);
		}
		copied = osc52Emitted || copyViaWindowsClipboard(text);
	}

	const headless = p === "linux" && !env.DISPLAY && !env.WAYLAND_DISPLAY && !env.TERMUX_VERSION;
	let oversized = false;
	if (!osc52Emitted && (isRemoteSession(env) || (!copied && headless))) {
		if (emitOsc52(text)) {
			copied = true;
		} else {
			oversized = true;
		}
	}

	if (copied) {
		return;
	}
	if (oversized) {
		throw new Error("Clipboard unavailable: text exceeds the OSC 52 size limit");
	}
	if (p === "linux") {
		if (env.TERMUX_VERSION) {
			throw new Error("Clipboard unavailable: install the Termux:API app and `termux-api` package");
		}
		if (env.WAYLAND_DISPLAY) {
			throw new Error("Clipboard unavailable: install `wl-clipboard` (`wl-copy`) or check Wayland access");
		}
		if (env.DISPLAY) {
			throw new Error("Clipboard unavailable: install `xclip` or `xsel`, or check X11 access");
		}
	}
	throw new Error("Clipboard unavailable");
}
