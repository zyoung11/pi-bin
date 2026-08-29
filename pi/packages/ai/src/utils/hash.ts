/** Fast deterministic hash to shorten long strings */
function imul(a: number, b: number): number {
	const ah = (a >>> 16) & 0xffff;
	const al = a & 0xffff;
	const bh = (b >>> 16) & 0xffff;
	const bl = b & 0xffff;
	return ((al * bl) + ((((ah * bl) + (al * bh)) << 16) >>> 0) | 0);
}

export function shortHash(str: string): string {
	let h1 = 0xdeadbeef;
	let h2 = 0x41c6ce57;
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		h1 = imul(h1 ^ ch, 2654435761);
		h2 = imul(h2 ^ ch, 1597334677);
	}
	h1 = imul(h1 ^ (h1 >>> 16), 2246822507) ^ imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = imul(h2 ^ (h2 >>> 16), 2246822507) ^ imul(h1 ^ (h1 >>> 13), 3266489909);
	return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
}
