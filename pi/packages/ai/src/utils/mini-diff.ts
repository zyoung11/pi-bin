/**
 * Minimal text diff implementation covering the jsdiff surface this codebase uses (diffLines,
 * diffWords, createTwoFilesPatch with FILE_HEADERS_ONLY-style headers). Diffs run over a
 * longest-common-subsequence matrix after common prefix/suffix trimming, which handles the
 * file sizes the edit tool operates on.
 */

export interface DiffPart {
	value: string;
	added: boolean;
	removed: boolean;
	count?: number;
}

export interface PatchHeaderOptions {
	includeIndex?: boolean;
	includeUnderline?: boolean;
	includeFileHeaders?: boolean;
}

export interface TwoFilesPatchOptions {
	context?: number;
	headerOptions?: PatchHeaderOptions;
}

export const FILE_HEADERS_ONLY: PatchHeaderOptions = {
	includeIndex: false,
	includeUnderline: false,
	includeFileHeaders: true,
};

const MAX_DP_CELLS = 9_000_000;

interface DiffOp {
	op: "equal" | "delete" | "insert";
	aIndex: number;
	bIndex: number;
}

function diffOps(a: string[], b: string[]): DiffOp[] {
	const ops: DiffOp[] = [];
	let prefix = 0;
	while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix += 1;
	for (let i = 0; i < prefix; i += 1) ops.push({ op: "equal", aIndex: i, bIndex: i });
	let aEnd = a.length;
	let bEnd = b.length;
	while (aEnd > prefix && bEnd > prefix && a[aEnd - 1] === b[bEnd - 1]) {
		aEnd -= 1;
		bEnd -= 1;
	}
	const aMiddle = a.slice(prefix, aEnd);
	const bMiddle = b.slice(prefix, bEnd);
	const middleOps = diffMiddle(aMiddle, bMiddle);
	for (const op of middleOps) {
		ops.push({ op: op.op, aIndex: op.aIndex + prefix, bIndex: op.bIndex + prefix });
	}
	for (let i = aEnd; i < a.length; i += 1) {
		ops.push({ op: "equal", aIndex: i, bIndex: bEnd + (i - aEnd) });
	}
	return ops;
}

function diffMiddle(a: string[], b: string[]): DiffOp[] {
	const n = a.length;
	const m = b.length;
	if (n === 0 && m === 0) return [];
	if (n === 0) {
		const ops: DiffOp[] = [];
		for (let j = 0; j < m; j += 1) ops.push({ op: "insert", aIndex: 0, bIndex: j });
		return ops;
	}
	if (m === 0) {
		const ops: DiffOp[] = [];
		for (let i = 0; i < n; i += 1) ops.push({ op: "delete", aIndex: i, bIndex: 0 });
		return ops;
	}
	if (n * m > MAX_DP_CELLS) {
		const ops: DiffOp[] = [];
		for (let i = 0; i < n; i += 1) ops.push({ op: "delete", aIndex: i, bIndex: 0 });
		for (let j = 0; j < m; j += 1) ops.push({ op: "insert", aIndex: n, bIndex: j });
		return ops;
	}
	const lcs: number[][] = [];
	for (let i = 0; i <= n; i += 1) {
		const row: number[] = [];
		for (let j = 0; j <= m; j += 1) row.push(0);
		lcs.push(row);
	}
	for (let i = n - 1; i >= 0; i -= 1) {
		for (let j = m - 1; j >= 0; j -= 1) {
			if (a[i] === b[j]) {
				lcs[i][j] = lcs[i + 1][j + 1] + 1;
			} else {
				const down = lcs[i + 1][j];
				const right = lcs[i][j + 1];
				lcs[i][j] = down >= right ? down : right;
			}
		}
	}
	const ops: DiffOp[] = [];
	let i = 0;
	let j = 0;
	while (i < n && j < m) {
		if (a[i] === b[j]) {
			ops.push({ op: "equal", aIndex: i, bIndex: j });
			i += 1;
			j += 1;
		} else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
			ops.push({ op: "delete", aIndex: i, bIndex: j });
			i += 1;
		} else {
			ops.push({ op: "insert", aIndex: i, bIndex: j });
			j += 1;
		}
	}
	while (i < n) {
		ops.push({ op: "delete", aIndex: i, bIndex: j });
		i += 1;
	}
	while (j < m) {
		ops.push({ op: "insert", aIndex: i, bIndex: j });
		j += 1;
	}
	return ops;
}

function splitLinesKeepEol(text: string): string[] {
	const lines: string[] = [];
	let start = 0;
	for (let index = 0; index < text.length; index += 1) {
		if (text[index] === "\n") {
			lines.push(text.slice(start, index + 1));
			start = index + 1;
		}
	}
	if (start < text.length) lines.push(text.slice(start));
	return lines;
}

function mergeParts(entries: { value: string; count: number; op: "equal" | "delete" | "insert" }[]): DiffPart[] {
	const parts: DiffPart[] = [];
	for (const entry of entries) {
		// Guard before the indexed read: an empty `parts` traps on [-1] in the
		// static runtime (JS returns undefined, which the `previous &&` below
		// was written to handle).
		const previous = parts.length > 0 ? parts[parts.length - 1] : undefined;
		const added = entry.op === "insert";
		const removed = entry.op === "delete";
		if (previous && previous.added === added && previous.removed === removed) {
			previous.value += entry.value;
			previous.count = (previous.count ?? 0) + entry.count;
		} else {
			parts.push({ count: entry.count, added, removed, value: entry.value });
		}
	}
	return parts;
}

export function diffLines(oldStr: string, newStr: string): DiffPart[] {
	const a = splitLinesKeepEol(oldStr);
	const b = splitLinesKeepEol(newStr);
	const ops = diffOps(a, b);
	const entries: { value: string; count: number; op: "equal" | "delete" | "insert" }[] = [];
	for (const op of ops) {
		if (op.op === "equal") entries.push({ value: a[op.aIndex], count: 1, op: "equal" });
		else if (op.op === "delete") entries.push({ value: a[op.aIndex], count: 1, op: "delete" });
		else entries.push({ value: b[op.bIndex], count: 1, op: "insert" });
	}
	return mergeParts(entries);
}

function tokenizeWords(text: string): string[] {
	const tokens: string[] = [];
	let index = 0;
	while (index < text.length) {
		const remaining = text.slice(index);
		const word = remaining.match(/^[a-zA-Z0-9_]+/);
		const space = word === null ? remaining.match(/^\s+/) : null;
		const matched = word !== null ? word[0] : space !== null ? space[0] : text.slice(index, index + 1);
		tokens.push(matched);
		index += matched.length;
	}
	return tokens;
}

export function diffWords(oldStr: string, newStr: string): DiffPart[] {
	const a = tokenizeWords(oldStr);
	const b = tokenizeWords(newStr);
	const ops = diffOps(a, b);
	const entries: { value: string; count: number; op: "equal" | "delete" | "insert" }[] = [];
	for (const op of ops) {
		if (op.op === "equal") entries.push({ value: a[op.aIndex], count: 1, op: "equal" });
		else if (op.op === "delete") entries.push({ value: a[op.aIndex], count: 1, op: "delete" });
		else entries.push({ value: b[op.bIndex], count: 1, op: "insert" });
	}
	return mergeParts(entries);
}

function hunkHeader(aStart: number, aCount: number, bStart: number, bCount: number): string {
	return `@@ -${aStart},${aCount} +${bStart},${bCount} @@`;
}

export function createTwoFilesPatch(
	oldFileName: string,
	newFileName: string,
	oldStr: string,
	newStr: string,
	oldHeader?: string,
	newHeader?: string,
	options?: TwoFilesPatchOptions,
): string {
	const headerOptions = options?.headerOptions ?? FILE_HEADERS_ONLY;
	const context = options?.context ?? 4;
	const lines: string[] = [];
	if (headerOptions.includeFileHeaders !== false) {
		lines.push(`--- ${oldFileName}${oldHeader ? `\t${oldHeader}` : ""}`);
		lines.push(`+++ ${newFileName}${newHeader ? `\t${newHeader}` : ""}`);
	}
	if (headerOptions.includeUnderline) {
		lines.push("====");
	}
	const a = splitLinesKeepEol(oldStr);
	const b = splitLinesKeepEol(newStr);
	const ops = diffOps(a, b);
	interface Change {
		op: "equal" | "delete" | "insert";
		text: string;
	}
	const changes: Change[] = [];
	for (const op of ops) {
		if (op.op === "equal") changes.push({ op: "equal", text: a[op.aIndex] });
		else if (op.op === "delete") changes.push({ op: "delete", text: a[op.aIndex] });
		else changes.push({ op: "insert", text: b[op.bIndex] });
	}
	const aBefore: number[] = [0];
	const bBefore: number[] = [0];
	for (let i = 0; i < changes.length; i += 1) {
		aBefore.push(aBefore[i] + (changes[i].op === "insert" ? 0 : 1));
		bBefore.push(bBefore[i] + (changes[i].op === "delete" ? 0 : 1));
	}
	let index = 0;
	while (index < changes.length) {
		while (index < changes.length && changes[index].op === "equal") index += 1;
		if (index >= changes.length) break;
		const changeStart = index;
		let changeEnd = index;
		while (changeEnd < changes.length && changes[changeEnd].op !== "equal") changeEnd += 1;
		let equalEnd = changeEnd;
		while (equalEnd < changes.length && changes[equalEnd].op === "equal") equalEnd += 1;
		const equalBefore = Math.min(changeStart, context);
		const equalAfter = Math.min(equalEnd - changeEnd, context);
		const hunkStart = changeStart - equalBefore;
		const hunkEnd = changeEnd + equalAfter;
		let aCount = 0;
		let bCount = 0;
		for (let i = hunkStart; i < hunkEnd; i += 1) {
			if (changes[i].op === "insert") bCount += 1;
			else if (changes[i].op === "delete") aCount += 1;
			else {
				aCount += 1;
				bCount += 1;
			}
		}
		const aStart = aCount === 0 ? aBefore[hunkStart] : aBefore[hunkStart] + 1;
		const bStart = bCount === 0 ? bBefore[hunkStart] : bBefore[hunkStart] + 1;
		lines.push(hunkHeader(aStart, aCount, bStart, bCount));
		for (let i = hunkStart; i < hunkEnd; i += 1) {
			const change = changes[i];
			const prefix = change.op === "equal" ? " " : change.op === "delete" ? "-" : "+";
			const body = `${prefix}${change.text}`;
			if (body.endsWith("\n")) {
				lines.push(body.slice(0, -1));
			} else {
				lines.push(body);
				lines.push("\\ No newline at end of file");
			}
		}
		index = changeEnd + equalAfter;
	}
	let out = "";
	for (const line of lines) out += `${line}\n`;
	return out;
}
