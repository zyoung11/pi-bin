/** Split a leading UTF-8 byte order mark from decoded text. */
export function splitBom(content: string): { bom: string; text: string } {
	if (content.charCodeAt(0) === 0xfeff) {
		return { bom: "\uFEFF", text: content.slice(1) };
	}
	return { bom: "", text: content };
}

/** Remove a leading UTF-8 byte order mark from decoded text. */
export function stripBom(content: string): string {
	if (content.charCodeAt(0) === 0xfeff) {
		return content.slice(1);
	}
	return content;
}
