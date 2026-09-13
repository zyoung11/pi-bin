import { TextSegmenter } from "../../../../tui/src/segmenter.ts";
import { WIDTHS } from "./width-data.ts";

/**
 * Display width, measured in grapheme clusters.
 *
 * A cluster is the unit both of measuring and of painting, so a box is always
 * sized for exactly what gets drawn into it. Splitting those two — sizing by
 * cluster but painting by code point — is what makes `👨‍👩‍👧` overflow its
 * border in the Rust original.
 *
 * Clustering comes from the TUI's local text segmenter (a pragmatic UAX #29
 * subset), which already handles ZWJ sequences, skin-tone modifiers,
 * variation selectors, keycaps, flags and Hangul. Per-code-point widths are
 * generated from the `unicode-width` crate.
 *
 * Port note: the upstream module iterates clusters with generator functions
 * over `Intl.Segmenter`; the scriptc runtime has neither, so clustering goes
 * through the TUI's TextSegmenter and the generators return arrays.
 */

const segmenter = new TextSegmenter("grapheme");

const VS16 = 0xfe0f;
const isRegionalIndicator = (cp: number): boolean => cp >= 0x1f1e6 && cp <= 0x1f1ff;

/** Width of one code point; the table covers the whole code point space. */
function codePointWidth(cp: number): number {
	let lo = 0;
	let hi = WIDTHS.length - 1;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const run = WIDTHS[mid];
		if (cp < run[0]) hi = mid - 1;
		else if (cp > run[1]) lo = mid + 1;
		else return run[2];
	}
	return 1;
}

/**
 * Columns occupied by one grapheme cluster.
 *
 * The widest code point wins, so a base plus its combining marks measures as
 * the base. Two adjustments: a variation selector requesting emoji
 * presentation forces two columns, as does a regional indicator pair (a flag).
 *
 * Zero is a real answer — a soft hyphen or zero-width space occupies nothing,
 * and callers skip painting such a cluster rather than reserving a cell.
 */
export function clusterWidth(cluster: string): number {
	let w = 0;
	let vs16 = false;
	let regional = 0;
	for (let k = 0; k < cluster.length; k++) {
		const unit = cluster.charCodeAt(k);
		let cp = unit;
		if (unit >= 0xd800 && unit <= 0xdbff && k + 1 < cluster.length) {
			const lo = cluster.charCodeAt(k + 1);
			if (lo >= 0xdc00 && lo <= 0xdfff) {
				cp = 0x10000 + ((unit - 0xd800) << 10) + (lo - 0xdc00);
				k += 1;
			}
		}
		if (cp === VS16) vs16 = true;
		if (isRegionalIndicator(cp)) regional++;
		const cw = codePointWidth(cp);
		if (cw > w) w = cw;
	}
	return vs16 || regional >= 2 ? 2 : w;
}

/** Iterate grapheme clusters, so no loop can split one. */
export function clusters(s: string): string[] {
	return segmenter.segment(s).map((entry) => entry.segment);
}

/** Iterate clusters paired with their display width. */
export function measured(s: string): [string, number][] {
	return segmenter.segment(s).map((entry) => [entry.segment, clusterWidth(entry.segment)]);
}

/** Display columns of a string. */
export function stringWidth(s: string): number {
	let w = 0;
	for (const { segment } of segmenter.segment(s)) w += clusterWidth(segment);
	return w;
}
