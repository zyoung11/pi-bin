import { existsSync, readFileSync } from "node:fs";
import type { ImageContent } from "../../../ai/src/index.ts";
import { processImage } from "./image-process.ts";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

/**
 * Extract image file paths from a message and turn them into inline image
 * attachments. A token counts as an image path when it is an absolute path
 * ending in a supported image extension and the file exists. The paths are
 * removed from the returned text.
 *
 * Returns an error message (instead of a partial send) when an image exists
 * but cannot be inlined (unsupported format or over the size limit), so the
 * user can scale it down themselves.
 */
export async function extractImageAttachments(text: string): Promise<{
	text: string;
	images: ImageContent[];
	error: string | undefined;
}> {
	const tokenPattern = /(^|\s)((?:\/|~\/)[^\s'"]+)/g;
	const images: ImageContent[] = [];
	let consumed: Array<{ start: number; end: number }> = [];
	let error: string | undefined;

	for (const match of text.matchAll(tokenPattern)) {
		const token = match[2];
		if (!hasImageExtension(token)) continue;
		if (!existsSync(token)) continue;
		const mimeType = mimeFromExtension(token);
		if (mimeType === null) continue;

		let bytes: Buffer;
		try {
			bytes = readFileSync(token);
		} catch {
			continue;
		}

		const processed = await processImage(bytes, mimeType);
		if (!processed.ok) {
			return { text, images: [], error: processed.message };
		}
		images.push({
			type: "image",
			data: processed.data ?? "",
			mimeType: processed.mimeType ?? mimeType,
		});
		consumed.push({ start: match.index + match[1].length, end: match.index + match[0].length });
	}

	if (consumed.length === 0) {
		return { text, images: [], error: undefined };
	}

	// Remove consumed tokens from the text, right to left to keep offsets valid.
	let out = text;
	for (let i = consumed.length - 1; i >= 0; i--) {
		const { start, end } = consumed[i];
		out = out.slice(0, start) + out.slice(end);
	}
	return { text: out.replace(/ {2,}/g, " ").trim(), images, error: undefined };
}

function hasImageExtension(token: string): boolean {
	const lower = token.toLowerCase();
	return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function mimeFromExtension(token: string): string | null {
	const lower = token.toLowerCase();
	if (lower.endsWith(".png")) return "image/png";
	if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
	if (lower.endsWith(".webp")) return "image/webp";
	if (lower.endsWith(".gif")) return "image/gif";
	return null;
}
