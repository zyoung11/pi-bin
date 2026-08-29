/**
 * Local text segmenter replacing Intl.Segmenter (no scriptc lowering). Grapheme segmentation
 * follows a pragmatic subset of UAX #29 (regional indicator pairs, Hangul Jamo runs, mark and
 * VS16/ZWJ attachment); word segmentation groups letter/number runs and emits other code points
 * singly. Byte offsets stay exact; cluster boundaries may differ from Intl on rare sequences.
 */

export interface SegmentData {
	segment: string;
	index: number;
	isWordLike?: boolean;
}

export type SegmenterGranularity = "grapheme" | "word";

interface CodePointInfo {
	cp: number;
	text: string;
	index: number;
	width: number;
}

function codePointAt(text: string, index: number): number | undefined {
	const first = text.charCodeAt(index);
	if (Number.isNaN(first)) return undefined;
	if (first < 0xd800 || first > 0xdbff) return first;
	const second = text.charCodeAt(index + 1);
	if (Number.isNaN(second) || second < 0xdc00 || second > 0xdfff) return first;
	return (first - 0xd800) * 0x400 + (second - 0xdc00) + 0x10000;
}

function codePointInfos(text: string): CodePointInfo[] {
	const out: CodePointInfo[] = [];
	let index = 0;
	while (index < text.length) {
		const cp = codePointAt(text, index) ?? 0;
		const width = cp > 0xffff ? 2 : 1;
		out.push({ cp, text: text.slice(index, index + width), index, width });
		index += width;
	}
	return out;
}

const markRegex = /^\p{M}$/u;
const vs16 = "\uFE0F";
const zwj = "\u200D";
const cr = "\r";
const lf = "\n";

const regionalMin = 0x1f1e6;
const regionalMax = 0x1f1ff;
const jamoVMin = 0x1160;
const jamoVMax = 0x11a7;
const jamoTMin = 0x11a8;
const jamoTMax = 0x11ff;

function isHangulExtend(cp: number): boolean {
	return (cp >= jamoVMin && cp <= jamoVMax) || (cp >= jamoTMin && cp <= jamoTMax);
}

const wordCharRegex = /[\p{L}\p{N}_]/u;

function segmentGraphemes(text: string): SegmentData[] {
	const infos = codePointInfos(text);
	const out: SegmentData[] = [];
	let clusterStart = 0;
	let clusterEnd = 0;
	let lastWasZwj = false;
	let lastWasCr = false;
	let openRegional = false;
	const flush = (endIndex: number): void => {
		if (clusterEnd > clusterStart) {
			out.push({ segment: text.slice(clusterStart, clusterEnd), index: clusterStart });
		}
		clusterStart = endIndex;
	};
	for (const info of infos) {
		const attaches =
			clusterEnd > clusterStart &&
			(info.text === vs16 ||
				info.text === zwj ||
				lastWasZwj ||
				lastWasCr ||
				markRegex.test(info.text) ||
				isHangulExtend(info.cp) ||
				(info.cp >= regionalMin && info.cp <= regionalMax && openRegional));
		if (!attaches && clusterEnd > clusterStart) {
			flush(info.index);
			openRegional = false;
		}
		clusterEnd = info.index + info.width;
		lastWasZwj = info.text === zwj;
		lastWasCr = info.text === cr;
		if (info.cp >= regionalMin && info.cp <= regionalMax) openRegional = !openRegional;
	}
	flush(text.length);
	return out;
}

function segmentWords(text: string): SegmentData[] {
	const infos = codePointInfos(text);
	const out: SegmentData[] = [];
	let start = 0;
	let wordLike = infos.length > 0 ? wordCharRegex.test(infos[0].text) : false;
	for (const info of infos) {
		const isWord = wordCharRegex.test(info.text);
		if (isWord !== wordLike) {
			out.push({ segment: text.slice(start, info.index), index: start, isWordLike: wordLike });
			start = info.index;
			wordLike = isWord;
		}
	}
	if (start < text.length) {
		out.push({ segment: text.slice(start), index: start, isWordLike: wordLike });
	}
	return out;
}

export class TextSegmenter {
	granularity: SegmenterGranularity;

	constructor(granularity: SegmenterGranularity) {
		this.granularity = granularity;
	}

	segment(text: string): SegmentData[] {
		return this.granularity === "grapheme" ? segmentGraphemes(text) : segmentWords(text);
	}
}
