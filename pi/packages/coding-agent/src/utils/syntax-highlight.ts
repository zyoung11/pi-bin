/**
 * Syntax highlighting for the statically compiled build.
 *
 * The engine is a port of rangi 2.2.0's synchronous regex-rule tokenizer
 * (itself an evolution of Speed Highlight), rewritten for the scriptc
 * runtime: no generators, no RegExp lastIndex writes, no match indices.
 * Rule match offsets come from String.search over a search string that keeps
 * the current line's prefix (so ^/$/lookaround assertions always evaluate
 * against the original line structure), match text from exec, and matches
 * that overlap the scan position are clamped to start at it — the same
 * match a lastIndex-driven engine produces when re-matching from that
 * position. Grammar data lives in ./syntax-highlight-langs.ts, generated
 * from rangi's grammar sources; four grammars with custom matcher objects
 * are hand-written in ./syntax-highlight-hand.ts.
 *
 * Token types are the rangi names ("kwd", "cmnt", "str", ...); theme.ts maps
 * them onto the syntax* palette through highlight().
 */

export interface ShjRule {
	/** Match pattern without the g/y flags (search/exec run non-global). */
	re: RegExp;
	/** The original flags, minus g/y (used to detect the m line-anchor flag). */
	flags: string;
	/** Token type name a theme maps a color to; empty means untyped. */
	type: string;
	/** Name of a sub-language applied to the matched text; empty means none. */
	sub: string;
	/** Inline sub-grammar applied to the matched text; empty means none. */
	subRules: ShjRule[];
}

export interface ShjLanguageDefinition {
	rules: ShjRule[];
	/** Token type for text the rules leave unmatched; empty means untyped. */
	defaultType: string;
}

export type ShjTokenCallback = (text: string, type?: string) => void;

export type ShjLanguageResolver = (name: string) => ShjLanguageDefinition | undefined;

/** Shared empty sub-grammar so every rule record keeps a uniform shape. */
export const NO_SUB_RULES: ShjRule[] = [];

/** Per-rule match state, kept across scan positions until invalidated. */
interface ShjRuleState {
	rule: ShjRule;
	dead: boolean;
	liHint: number;
	has: boolean;
	index: number;
	end: number;
	text: string;
}

/** Unescaped ^ outside character classes (line anchor with m, absolute without). */
function hasLineAnchor(source: string): boolean {
	let inClass = false;
	for (let i = 0; i < source.length; i++) {
		const ch = source[i];
		if (ch === "\\") {
			i += 1;
			continue;
		}
		if (inClass) {
			if (ch === "]") inClass = false;
			continue;
		}
		if (ch === "^") return true;
	}
	return false;
}

/**
 * Find the first match of the rule at or after `pos`, with ^/$/lookaround
 * assertions evaluated against the original string's line structure: the
 * search string keeps the current line's prefix, and matches that lie
 * entirely before pos are stepped over. A match that only overlaps pos (its
 * start is before pos but its end is past it) is returned clamped to start
 * at pos — the same match a lastIndex-driven engine produces when
 * re-matching from that position. Returns undefined when nothing matches at
 * or after pos anywhere in the string.
 */
function findMatch(
	src: string,
	rule: ShjRule,
	pos: number,
	lineStarts: number[],
	liHintRef: { value: number },
): { index: number; end: number; text: string } | undefined {
	const lineAnchored = rule.flags.indexOf("m") !== -1 && hasLineAnchor(rule.re.source);
	if (lineAnchored) {
		while (liHintRef.value < lineStarts.length) {
			const lineStart = lineStarts[liHintRef.value];
			if (lineStart < pos) {
				liHintRef.value += 1;
				continue;
			}
			const lineSlice = src.slice(lineStart);
			const off = lineSlice.search(rule.re);
			if (off === -1) return undefined;
			const abs = lineStart + off;
			while (liHintRef.value + 1 < lineStarts.length && lineStarts[liHintRef.value + 1] <= abs) {
				liHintRef.value += 1;
			}
			const raw: unknown = rule.re.exec(lineSlice.slice(off));
			if (raw === null || raw === undefined) return undefined;
			const text = String((raw as string[])[0] ?? "");
			if (text.length === 0) {
				liHintRef.value += 1;
				continue;
			}
			const start = abs < pos ? pos : abs;
			return { index: start, end: abs + text.length, text: src.slice(start, abs + text.length) };
		}
		return undefined;
	}
	const sliceStr = src.slice(pos);
	const offset = sliceStr.search(rule.re);
	if (offset === -1) return undefined;
	const raw: unknown = rule.re.exec(sliceStr.slice(offset));
	if (raw === null || raw === undefined) return undefined;
	const text = String((raw as string[])[0] ?? "");
	const start = pos + offset;
	return { index: start, end: start + text.length, text };
}

/**
 * Find the tokens in the given code and call the callback with each of them.
 *
 * Leftmost match wins; ties go to the earlier rule in the grammar. Text no
 * rule matched is emitted with the grammar's default type. An unknown
 * sub-language leaves the matched text untyped rather than throwing.
 */
export function eachToken(
	src: string,
	def: ShjLanguageDefinition,
	onToken: ShjTokenCallback,
	resolve: ShjLanguageResolver,
): void {
	try {
		const states: ShjRuleState[] = [];
		const lineStarts: number[] = [0];
		for (let k = 0; k < src.length; k++) {
			if (src[k] === "\n") lineStarts.push(k + 1);
		}
		for (const rule of def.rules) {
			states.push({
				rule,
				dead: false,
				liHint: 0,
				has: false,
				index: 0,
				end: 0,
				text: "",
			});
		}
		let i = 0;
		while (i < src.length) {
			let bestIndex = -1;
			let bestEnd = 0;
			let bestText = "";
			let bestType = "";
			let bestSub = "";
			let bestSubRules: ShjRule[] = NO_SUB_RULES;
			let m = states.length;
			while (m > 0) {
				m -= 1;
				const st = states[m];
				if (st.dead) continue;
				if (!st.has || st.index < i) {
					const hintRef = { value: st.liHint };
					const found = findMatch(src, st.rule, i, lineStarts, hintRef);
					st.liHint = hintRef.value;
					if (found === undefined) {
						st.dead = true;
						continue;
					}
					st.has = true;
					st.index = found.index;
					st.end = found.end;
					st.text = found.text;
				}
				// zero-width matches never advance the scan and are not candidates
				if (st.text.length > 0 && (bestIndex === -1 || st.index <= bestIndex)) {
					bestIndex = st.index;
					bestEnd = st.end;
					bestText = st.text;
					bestType = st.rule.type;
					bestSub = st.rule.sub;
					bestSubRules = st.rule.subRules;
				}
			}
			if (bestIndex === -1) {
				onToken(src.slice(i, src.length), def.defaultType);
				return;
			}
			if (bestIndex > i) onToken(src.slice(i, bestIndex), def.defaultType);
			i = bestIndex;
			if (bestSubRules.length > 0) {
				eachToken(src.slice(i, bestEnd), { rules: bestSubRules, defaultType: bestType }, onToken, resolve);
			} else if (bestSub !== "") {
				const subDef = resolve(bestSub);
				if (subDef !== undefined) {
					eachToken(src.slice(i, bestEnd), subDef, onToken, resolve);
				} else {
					onToken(bestText, bestType);
				}
			} else {
				onToken(bestText, bestType);
			}
			i = bestEnd;
		}
		onToken(src.slice(i, src.length), def.defaultType);
	} catch (e) {
		console.error(`[shj-engine] eachToken threw: ${e instanceof Error ? e.message : String(e)}`);
		onToken(src);
	}
}

/** A token: raw text plus the token type name, when a rule claimed it. */
export interface ShjTokenized {
	text: string;
	type?: string;
}

/**
 * Split a string into its tokens, without rendering anything. Tokens come in
 * source order and their text is raw — concatenating them gives the input
 * back. A token may span line breaks; split tokens on newlines to render per
 * line.
 */
export function tokenize(code: string, lang: string, resolve: ShjLanguageResolver): ShjTokenized[] {
	const tokens: ShjTokenized[] = [];
	const def = resolve(lang);
	if (def === undefined) {
		return [{ text: code }];
	}
	eachToken(
		code,
		def,
		(text, type) => {
			// the engine emits empty slices between adjacent matches
			if (text) tokens.push(type === "" ? { text } : { text, type });
		},
		resolve,
	);
	if (tokens.length === 0) {
		tokens.push({ text: code });
	}
	return tokens;
}
