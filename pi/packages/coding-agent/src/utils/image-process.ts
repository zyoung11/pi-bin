/**
 * Image processing for inline image payloads.
 *
 * Static builds carry no native resize engine: supported images pass through
 * as-is, oversized or unsupported ones are omitted with a note.
 */

export interface ProcessImageOptions {
	autoResizeImages?: boolean;
	resizeOptions?: Record<string, unknown>;
}

export type ProcessImageResult =
	| {
			ok: true;
			data: string;
			mimeType: string;
			hints: string[];
	  }
	| {
			ok: false;
			message: string;
	  };

const MAX_INLINE_IMAGE_BYTES = 4 * 1024 * 1024;

function baseMimeType(mimeType: string): string {
	const raw = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
	return raw.toLowerCase();
}

function normalizeInlineMimeType(mimeType: string): string | null {
	switch (baseMimeType(mimeType)) {
		case "image/png":
			return "image/png";
		case "image/jpeg":
		case "image/jpg":
			return "image/jpeg";
		case "image/gif":
			return "image/gif";
		case "image/webp":
			return "image/webp";
		default:
			return null;
	}
}

export async function processImage(
	bytes: Uint8Array,
	mimeType: string,
	options?: ProcessImageOptions,
): Promise<ProcessImageResult> {
	const normalizedMime = normalizeInlineMimeType(mimeType);
	if (!normalizedMime) {
		return {
			ok: false,
			message: "[Image omitted: could not be converted to a supported inline image format.]",
		};
	}

	if (bytes.byteLength > MAX_INLINE_IMAGE_BYTES) {
		return {
			ok: false,
			message: `[Image omitted: ${Math.round(bytes.byteLength / 1024)}KB exceeds the ${MAX_INLINE_IMAGE_BYTES / 1024 / 1024}MB inline limit (images are not resized).]`,
		};
	}

	return {
		ok: true,
		data: Buffer.from(bytes).toString("base64"),
		mimeType: normalizedMime,
		hints: [],
	};
}
