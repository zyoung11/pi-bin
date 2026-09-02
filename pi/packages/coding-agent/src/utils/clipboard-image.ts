import { spawnSync } from "child_process";
import { randomUUID } from "crypto";
import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export interface ClipboardImage {
	bytes: Buffer;
	mimeType: string;
}

/**
 * Read an image from the system clipboard via Wayland (wl-paste) with an
 * X11 (xclip) fallback. Returns null when the clipboard holds no image.
 * Binary output is captured through a temp file redirection because
 * execFileSync with a non-utf8 encoding has no static lowering. No resizing
 * is performed in static builds: oversized images surface an error so the
 * user can scale them down themselves.
 */
export function readClipboardImage(): ClipboardImage | null {
	const isWayland = Boolean(process.env.WAYLAND_DISPLAY);
	const tools = isWayland ? ["wl-paste", "xclip"] : ["xclip", "wl-paste"];
	const mimeTypes = ["image/png", "image/jpeg"];
	const probePath = join(tmpdir(), `pi-clipboard-read-${randomUUID()}`);
	try {
		for (const cmd of tools) {
			for (const mimeType of mimeTypes) {
				const args =
					cmd === "wl-paste"
						? ["--no-newline", "--type", mimeType]
						: ["-selection", "clipboard", "-t", mimeType, "-o"];
				const argsText = args.map((arg) => `'${arg}'`).join(" ");
				try {
					spawnSync("sh", ["-c", `${cmd} ${argsText} > '${probePath}' 2>/dev/null`], {
						timeout: 3000,
					});
				} catch {
					// Probe failures fall through to the next tool/type.
				}
				try {
					const bytes = readFileSync(probePath);
					if (bytes.length > 0) {
						return { bytes, mimeType };
					}
				} catch {
					// No file written: tool missing or clipboard holds no image of this type.
				}
			}
		}
	} finally {
		try {
			unlinkSync(probePath);
		} catch {
			// Already cleaned up.
		}
	}
	return null;
}

/** Write clipboard image bytes to a temp file and return its path. */
export function writeClipboardImageToTemp(image: ClipboardImage): string {
	const ext = image.mimeType === "image/png" ? "png" : "jpg";
	const filePath = join(tmpdir(), `pi-clipboard-${randomUUID()}.${ext}`);
	writeFileSync(filePath, image.bytes);
	return filePath;
}
