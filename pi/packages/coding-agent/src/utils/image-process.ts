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

/**
 * Flat result shape (no discriminated union): scriptc's union return re-tagging
 * corrupted the value on first runtime execution (Unhandled rejection: "value
 * is not representable in the target union"). Consumers branch on `ok`.
 */
export interface ProcessImageResult {
	ok: boolean;
	data?: string;
	mimeType?: string;
	hints?: string[];
	message?: string;
}

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
	_options?: ProcessImageOptions,
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
