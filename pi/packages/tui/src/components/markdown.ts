import { renderLatex } from "../latex.ts";
import {
	Marked,
	type Token,
	Tokenizer,
	type TokenizerExtension,
	type Tokens,
	type TokensBlockquote,
	type TokensGeneric,
	type TokensText,
} from "../mini-markdown.ts";
import { getCapabilities, hyperlink, isImageLine } from "../terminal-image.ts";
import { Component } from "../tui.ts";
import { applyBackgroundToLine, visibleWidth, wrapTextWithAnsi } from "../utils.ts";

function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

function reviveTokenValue(value: unknown): unknown {
	if (value === null || typeof value !== "object") return value;
	if (Array.isArray(value)) {
		const items = value as unknown[];
		const out: unknown[] = [];
		for (let i = 0; i < items.length; i++) out.push(reviveTokenValue(items[i]));
		return out;
	}
	const source = recordViewOf(value);
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(source)) {
		out[key] = reviveTokenValue(source[key]);
	}
	return out;
}

function reviveTokenTree(tokens: unknown[]): unknown[] {
	const out: unknown[] = [];
	for (let i = 0; i < tokens.length; i++) out.push(reviveTokenValue(tokens[i]));
	return out;
}

const STRICT_STRIKETHROUGH_REGEX = /^(~~)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/;

class StrictStrikethroughTokenizer extends Tokenizer {
	override del(src: string): Tokens.Del | undefined {
		const match = STRICT_STRIKETHROUGH_REGEX.exec(src);
		if (!match) {
			return undefined;
		}

		const text = match[2] ?? "";
		return {
			type: "del",
			raw: match[0],
			text,
			tokens: this.lexer?.inlineTokens(text) ?? [],
		};
	}
}

interface LatexToken extends Tokens.Generic {
	type: "latex" | "latexBlock";
	text: string;
	pending?: boolean;
}

function isEscaped(source: string, index: number): boolean {
	let backslashes = 0;
	for (let position = index - 1; position >= 0 && source[position] === "\\"; position--) {
		backslashes++;
	}
	return backslashes % 2 === 1;
}

function findClosingDelimiter(source: string, closing: string, start: number): number {
	let index = source.indexOf(closing, start);
	while (index >= 0 && isEscaped(source, index)) {
		index = source.indexOf(closing, index + closing.length);
	}
	return index;
}

function looksLikePendingDollarMath(source: string): boolean {
	return /\\[A-Za-z]+|[_^=+*/<>()[\]|±≤≥≠≈∈→⇒∞∫∑√-]/.test(source);
}

function tokenizeInlineLatex(source: string, tokens: Token[]): Token | TokensGeneric | undefined {
	void tokens;
	let opening = "";
	let closing = "";
	if (source.startsWith("$$")) {
		opening = "$$";
		closing = "$$";
	} else if (source.startsWith("\\(")) {
		opening = "\\(";
		closing = "\\)";
	} else if (source.startsWith("\\[")) {
		opening = "\\[";
		closing = "\\]";
	} else if (source.startsWith("$") && !/^\$\s/.test(source)) {
		opening = "$";
		closing = "$";
	} else {
		return undefined;
	}

	const closingIndex = findClosingDelimiter(source, closing, opening.length);
	if (
		closingIndex >= 0 &&
		opening === "$" &&
		(/\s$/.test(source.slice(opening.length, closingIndex)) ||
			/^\d/.test(source.slice(closingIndex + 1)) ||
			(/^[A-Z_][A-Z0-9_]*(?:[^A-Za-z0-9_\s])?$/.test(source.slice(opening.length, closingIndex)) &&
				/^[A-Za-z_][A-Za-z0-9_]*/.test(source.slice(closingIndex + 1))) ||
			source.slice(opening.length, closingIndex).includes("`"))
	) {
		return undefined;
	}

	if (closingIndex < 0) {
		const pendingSource = source.slice(opening.length);
		if (opening.startsWith("\\") || looksLikePendingDollarMath(pendingSource)) {
			return { type: "latex", raw: source, text: pendingSource, pending: true };
		}
		return undefined;
	}

	const text = source.slice(opening.length, closingIndex);
	if (!text || text.includes("\n")) {
		return undefined;
	}

	const raw = source.slice(0, closingIndex + closing.length);
	return { type: "latex", raw, text };
}

function tokenizeBlockLatex(source: string, tokens: Token[]): Token | TokensGeneric | undefined {
	void tokens;
	const dollarMatch = /^ {0,3}\$\$[ \t]*(?:\n)?([\s\S]*?)\$\$[ \t]*(?:\n|$)/.exec(source);
	if (dollarMatch?.[1]) {
		return { type: "latexBlock", raw: dollarMatch[0], text: dollarMatch[1].trim() };
	}

	const bracketMatch = /^ {0,3}\\\[[ \t]*(?:\n)?([\s\S]*?)\\\][ \t]*(?:\n|$)/.exec(source);
	if (bracketMatch?.[1]) {
		return { type: "latexBlock", raw: bracketMatch[0], text: bracketMatch[1].trim() };
	}

	const pendingBracket = /^ {0,3}\\\[[ \t]*(?:\n)?([\s\S]*)$/.exec(source);
	if (pendingBracket) {
		return { type: "latexBlock", raw: pendingBracket[0], text: pendingBracket[1], pending: true };
	}
	const pendingDollar = /^ {0,3}\$\$[ \t]*(?:\n)?([\s\S]*)$/.exec(source);
	if (pendingDollar?.[1] && looksLikePendingDollarMath(pendingDollar[1])) {
		return { type: "latexBlock", raw: pendingDollar[0], text: pendingDollar[1], pending: true };
	}
	return undefined;
}

const LATEX_MARKDOWN_EXTENSIONS: readonly TokenizerExtension[] = [
	{
		name: "latexBlock",
		level: "block",
		start(source) {
			const match = /(?:^|\n) {0,3}(?:\$\$|\\\[)/.exec(source);
			if (!match) return undefined;
			const newlineOffset = match[0].startsWith("\n") ? 1 : 0;
			const matchStart = source.indexOf(match[0]);
			return matchStart + newlineOffset;
		},
		tokenizer: tokenizeBlockLatex,
	},
	{
		name: "latex",
		level: "inline",
		start(source) {
			let best = -1;
			const candidates = [source.indexOf("$"), source.indexOf("\\("), source.indexOf("\\[")];
			for (const index of candidates) {
				if (index >= 0 && (best < 0 || index < best)) best = index;
			}
			return best >= 0 ? best : undefined;
		},
		tokenizer: tokenizeInlineLatex,
	},
];

function trimPartialClosingFences(tokens: readonly unknown[]): void {
	if (tokens.length === 0) return;
	const view = recordViewOf(tokens[tokens.length - 1]);
	const tokenType = view["type"];
	if (tokenType === "list") {
		const rawItems = view["items"];
		const items: unknown[] =
			rawItems !== null && rawItems !== undefined && typeof rawItems === "object" ? (rawItems as unknown[]) : [];
		if (items.length === 0) return;
		const lastItem = recordViewOf(items[items.length - 1]);
		const lastTokens = lastItem["tokens"];
		trimPartialClosingFences(
			lastTokens !== null && lastTokens !== undefined && typeof lastTokens === "object"
				? (lastTokens as unknown[])
				: [],
		);
		return;
	}
	if (tokenType === "blockquote") {
		const lastTokens = view["tokens"];
		trimPartialClosingFences(
			lastTokens !== null && lastTokens !== undefined && typeof lastTokens === "object"
				? (lastTokens as unknown[])
				: [],
		);
		return;
	}
	if (tokenType !== "code") {
		return;
	}

	// Trim streamed partial closing fences so code blocks do not shrink/flicker
	// when the final fence character arrives. See https://github.com/earendil-works/pi/issues/5825.
	const codeRaw = view["raw"];
	const codeTextValue = view["text"];
	if (typeof codeRaw !== "string" || typeof codeTextValue !== "string") {
		return;
	}
	const marker = /^(`{3,}|~{3,})/.exec(codeRaw)?.[1];
	const lastLine = codeRaw.split("\n").pop();
	if (!marker || !lastLine || lastLine.length >= marker.length || lastLine !== marker[0]?.repeat(lastLine.length)) {
		return;
	}

	const trimmedText = codeTextValue.slice(0, -lastLine.length).replace(/\n$/, "");
	view["text"] = trimmedText;
}

const markdownParser = new Marked();
markdownParser.setOptions({
	tokenizer: new StrictStrikethroughTokenizer(),
});
markdownParser.use({ extensions: [...LATEX_MARKDOWN_EXTENSIONS] });

/**
 * Default text styling for markdown content.
 * Applied to all text unless overridden by markdown formatting.
 */
export interface DefaultTextStyle {
	/** Foreground color function */
	color?: (text: string) => string;
	/** Background color function */
	bgColor?: (text: string) => string;
	/** Bold text */
	bold?: boolean;
	/** Italic text */
	italic?: boolean;
	/** Strikethrough text */
	strikethrough?: boolean;
	/** Underline text */
	underline?: boolean;
}

/**
 * Theme functions for markdown elements.
 * Each function takes text and returns styled text with ANSI codes.
 */
export interface MarkdownTheme {
	heading: (text: string) => string;
	link: (text: string) => string;
	linkUrl: (text: string) => string;
	code: (text: string) => string;
	codeBlock: (text: string) => string;
	codeBlockBorder: (text: string) => string;
	quote: (text: string) => string;
	quoteBorder: (text: string) => string;
	hr: (text: string) => string;
	listBullet: (text: string) => string;
	bold: (text: string) => string;
	italic: (text: string) => string;
	strikethrough: (text: string) => string;
	underline: (text: string) => string;
	highlightCode?: (code: string, lang?: string) => string[];
	/** Prefix applied to each rendered code block line (default: "  ") */
	codeBlockIndent?: string;
}

export interface MarkdownOptions {
	/** Preserve source list markers instead of normalizing them. */
	preserveOrderedListMarkers?: boolean;
	/** Preserve source backslash escapes instead of normalizing escaped punctuation. */
	preserveBackslashEscapes?: boolean;
	/** Transform source Markdown before parsing, with the exact width available for content. */
	transform?: (markdown: string, availableWidth: number) => string;
	/** Render supported LaTeX math expressions as Unicode text (default: true). */
	renderLatex?: boolean;
}

interface InlineStyleContext {
	applyText: (text: string) => string;
	stylePrefix: string;
}

export class Markdown extends Component {
	private text: string;
	private paddingX: number; // Left/right padding
	private paddingY: number; // Top/bottom padding
	private defaultTextStyle?: DefaultTextStyle;
	private theme: MarkdownTheme;
	private options: MarkdownOptions;
	private defaultStylePrefix?: string;

	// Cache for rendered output
	private cachedText?: string;
	private cachedWidth?: number;
	private cachedLines?: string[];

	constructor(
		text: string,
		paddingX: number,
		paddingY: number,
		theme: MarkdownTheme,
		defaultTextStyle?: DefaultTextStyle,
		options?: MarkdownOptions,
	) {
		super();
		this.text = text;
		this.paddingX = paddingX;
		this.paddingY = paddingY;
		this.theme = theme;
		this.defaultTextStyle = defaultTextStyle;
		this.options = options ? { ...options } : {};
	}

	setText(text: string): void {
		this.text = text;
		this.invalidate();
	}

	invalidate(): void {
		this.cachedText = undefined;
		this.cachedWidth = undefined;
		this.cachedLines = undefined;
	}

	render(width: number): string[] {
		// Check cache
		if (this.cachedLines && this.cachedText === this.text && this.cachedWidth === width) {
			return this.cachedLines;
		}

		// Calculate available width for content (subtract horizontal padding)
		const contentWidth = Math.max(1, width - this.paddingX * 2);
		const text = this.options.transform?.(this.text, contentWidth) ?? this.text;

		// Don't render anything if there's no actual text
		if (!text || text.trim() === "") {
			const result: string[] = [];
			// Update cache
			this.cachedText = this.text;
			this.cachedWidth = width;
			this.cachedLines = result;
			return result;
		}

		// Replace tabs with 3 spaces for consistent rendering
		const normalizedText = text.replace(/\t/g, "   ");

		// Parse markdown to HTML-like tokens, then revive the whole tree into
		// plain records/arrays: the lexer's Token[] holds 13-arm union members at
		// runtime, and any cast/param boundary over those members corrupts the
		// heap (ASan-confirmed 4-byte OOB write inside renderInlineTokens).
		const tokens = reviveTokenTree(markdownParser.lexer(normalizedText) as unknown[]);
		trimPartialClosingFences(tokens);

		// Convert tokens to styled terminal output
		const renderedLines: string[] = [];

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			const nextToken = i + 1 < tokens.length ? tokens[i + 1] : undefined;
			let nextTokenType: string | undefined;
			if (nextToken !== undefined) {
				const nextTypeValue = recordViewOf(nextToken)["type"];
				if (typeof nextTypeValue === "string") nextTokenType = nextTypeValue;
			}
			const tokenLines = this.renderToken(token, contentWidth, nextTokenType);
			for (const tokenLine of tokenLines) {
				renderedLines.push(tokenLine);
			}
		}

		// Wrap lines (NO padding, NO background yet)
		const wrappedLines: string[] = [];
		for (const line of renderedLines) {
			if (isImageLine(line)) {
				wrappedLines.push(line);
			} else {
				for (const wrappedLine of wrapTextWithAnsi(line, contentWidth)) {
					wrappedLines.push(wrappedLine);
				}
			}
		}

		// Add margins and background to each wrapped line
		const leftMargin = " ".repeat(this.paddingX);
		const rightMargin = " ".repeat(this.paddingX);
		const bgFn = this.defaultTextStyle?.bgColor;
		const contentLines: string[] = [];

		for (const line of wrappedLines) {
			if (isImageLine(line)) {
				contentLines.push(line);
				continue;
			}

			const lineWithMargins = leftMargin + line + rightMargin;

			if (bgFn) {
				contentLines.push(applyBackgroundToLine(lineWithMargins, width, bgFn));
			} else {
				// No background - just pad to width
				const visibleLen = visibleWidth(lineWithMargins);
				const paddingNeeded = Math.max(0, width - visibleLen);
				contentLines.push(lineWithMargins + " ".repeat(paddingNeeded));
			}
		}

		// Add top/bottom padding (empty lines)
		const emptyLine = " ".repeat(width);
		const emptyLines: string[] = [];
		for (let i = 0; i < this.paddingY; i++) {
			const line = bgFn ? applyBackgroundToLine(emptyLine, width, bgFn) : emptyLine;
			emptyLines.push(line);
		}

		// Combine top padding, content, and bottom padding
		const result = emptyLines.concat(contentLines, emptyLines);

		// Update cache
		this.cachedText = this.text;
		this.cachedWidth = width;
		this.cachedLines = result;

		return result.length > 0 ? result : [""];
	}

	/**
	 * Apply default text style to a string.
	 * This is the base styling applied to all text content.
	 * NOTE: Background color is NOT applied here - it's applied at the padding stage
	 * to ensure it extends to the full line width.
	 */
	private applyDefaultStyle(text: string): string {
		if (!this.defaultTextStyle) {
			return text;
		}

		let styled = text;

		// Apply foreground color (NOT background - that's applied at padding stage)
		const colorFn = this.defaultTextStyle.color;
		if (colorFn) {
			styled = colorFn(styled);
		}

		// Apply text decorations using this.theme
		if (this.defaultTextStyle.bold) {
			styled = this.theme.bold(styled);
		}
		if (this.defaultTextStyle.italic) {
			styled = this.theme.italic(styled);
		}
		if (this.defaultTextStyle.strikethrough) {
			styled = this.theme.strikethrough(styled);
		}
		if (this.defaultTextStyle.underline) {
			styled = this.theme.underline(styled);
		}

		return styled;
	}

	private getDefaultStylePrefix(): string {
		if (!this.defaultTextStyle) {
			return "";
		}

		if (this.defaultStylePrefix !== undefined) {
			return this.defaultStylePrefix;
		}

		const sentinel = "\u0000";
		let styled = sentinel;

		const baseColorFn = this.defaultTextStyle.color;
		if (baseColorFn) {
			styled = baseColorFn(styled);
		}

		if (this.defaultTextStyle.bold) {
			styled = this.theme.bold(styled);
		}
		if (this.defaultTextStyle.italic) {
			styled = this.theme.italic(styled);
		}
		if (this.defaultTextStyle.strikethrough) {
			styled = this.theme.strikethrough(styled);
		}
		if (this.defaultTextStyle.underline) {
			styled = this.theme.underline(styled);
		}

		const sentinelIndex = styled.indexOf(sentinel);
		this.defaultStylePrefix = sentinelIndex >= 0 ? styled.slice(0, sentinelIndex) : "";
		return this.defaultStylePrefix;
	}

	private getStylePrefix(styleFn: (text: string) => string): string {
		const sentinel = "\u0000";
		const styled = styleFn(sentinel);
		const sentinelIndex = styled.indexOf(sentinel);
		return sentinelIndex >= 0 ? styled.slice(0, sentinelIndex) : "";
	}

	private getDefaultInlineStyleContext(): InlineStyleContext {
		return {
			applyText: (text: string) => this.applyDefaultStyle(text),
			stylePrefix: this.getDefaultStylePrefix(),
		};
	}

	private renderToken(
		token: unknown,
		width: number,
		nextTokenType?: string,
		styleContext?: InlineStyleContext,
	): string[] {
		// Dyn-channel rendering: typed switch narrowing on the 13-arm Token union
		// writes retags outside the array element (ASan-confirmed heap overflow),
		// so every field read goes through recordViewOf and dispatch is an if-chain.
		const lines: string[] = [];
		const view = recordViewOf(token);
		const tokenType = view["type"];

		if (tokenType === "heading") {
			const rawDepth = view["depth"];
			const headingLevel = typeof rawDepth === "number" ? rawDepth : 1;
			const headingPrefix = `${"#".repeat(headingLevel)} `;

			let headingStyleFn: (text: string) => string;
			if (headingLevel === 1) {
				headingStyleFn = (text: string) => this.theme.heading(this.theme.bold(this.theme.underline(text)));
			} else {
				headingStyleFn = (text: string) => this.theme.heading(this.theme.bold(text));
			}

			const headingStyleContext: InlineStyleContext = {
				applyText: headingStyleFn,
				stylePrefix: this.getStylePrefix(headingStyleFn),
			};

			const headingNested = view["tokens"];
			const headingText = this.renderInlineTokens(
				headingNested !== null && headingNested !== undefined && typeof headingNested === "object"
					? (headingNested as unknown[])
					: [],
				headingStyleContext,
			);
			const styledHeading = headingLevel >= 3 ? headingStyleFn(headingPrefix) + headingText : headingText;
			lines.push(styledHeading);
			if (nextTokenType && nextTokenType !== "space") {
				lines.push("");
			}
		} else if (tokenType === "paragraph") {
			const nested = view["tokens"];
			const paragraphText = this.renderInlineTokens(
				nested !== null && nested !== undefined && typeof nested === "object" ? (nested as unknown[]) : [],
				styleContext,
			);
			lines.push(paragraphText);
			if (nextTokenType && nextTokenType !== "list" && nextTokenType !== "space") {
				lines.push("");
			}
		} else if (tokenType === "text") {
			lines.push(this.renderInlineTokens([token], styleContext));
		} else if (tokenType === "latexBlock") {
			const pending = view["pending"];
			const latexText = view["text"];
			const latexRaw = view["raw"];
			const rawStr = typeof latexRaw === "string" ? latexRaw : "";
			const rendered =
				pending !== true && this.options.renderLatex !== false && typeof latexText === "string"
					? (renderLatex(latexText, { display: true }) ?? rawStr.trim())
					: rawStr.trim();
			for (const line of rendered.split("\n")) {
				lines.push(this.applyDefaultStyle(line));
			}
			if (nextTokenType && nextTokenType !== "space") {
				lines.push("");
			}
		} else if (tokenType === "code") {
			const indent = this.theme.codeBlockIndent ?? "  ";
			const lang = view["lang"];
			const langStr = typeof lang === "string" ? lang : "";
			lines.push(this.theme.codeBlockBorder(`\`\`\`${langStr}`));
			const highlightCode = this.theme.highlightCode;
			const codeText = view["text"];
			const codeStr = typeof codeText === "string" ? codeText : "";
			if (highlightCode) {
				const highlightedLines = highlightCode(codeStr, langStr);
				for (const hlLine of highlightedLines) {
					lines.push(`${indent}${hlLine}`);
				}
			} else {
				const codeLines = codeStr.split("\n");
				for (const codeLine of codeLines) {
					lines.push(`${indent}${this.theme.codeBlock(codeLine)}`);
				}
			}
			lines.push(this.theme.codeBlockBorder("```"));
			if (nextTokenType && nextTokenType !== "space") {
				lines.push("");
			}
		} else if (tokenType === "list") {
			const listLines = this.renderList(view, 0, width, styleContext);
			lines.push(...listLines);
		} else if (tokenType === "table") {
			const tableLines = this.renderTable(view, width, nextTokenType, styleContext);
			lines.push(...tableLines);
		} else if (tokenType === "blockquote") {
			const quoteStyle = (text: string) => this.theme.quote(this.theme.italic(text));
			const quoteStylePrefix = this.getStylePrefix(quoteStyle);
			const applyQuoteStyle = (line: string): string => {
				if (!quoteStylePrefix) {
					return quoteStyle(line);
				}
				const lineWithReappliedStyle = line.replace(/\x1b\[0m/g, `\x1b[0m${quoteStylePrefix}`);
				return quoteStyle(lineWithReappliedStyle);
			};

			const quoteContentWidth = Math.max(1, width - 2);

			const quoteInlineStyleContext: InlineStyleContext = {
				applyText: (text: string) => text,
				stylePrefix: quoteStylePrefix,
			};
			const nested = view["tokens"];
			const quoteTokens: unknown[] =
				nested !== null && nested !== undefined && typeof nested === "object" ? (nested as unknown[]) : [];
			const renderedQuoteLines: string[] = [];
			for (let i = 0; i < quoteTokens.length; i++) {
				const quoteToken = quoteTokens[i];
				const nextQuoteToken = i + 1 < quoteTokens.length ? quoteTokens[i + 1] : undefined;
				let nextQuoteTokenType: string | undefined;
				if (nextQuoteToken !== undefined)
					nextQuoteTokenType = recordViewOf(nextQuoteToken)["type"] as string | undefined;
				renderedQuoteLines.push(
					...this.renderToken(quoteToken, quoteContentWidth, nextQuoteTokenType, quoteInlineStyleContext),
				);
			}

			while (renderedQuoteLines.length > 0 && renderedQuoteLines[renderedQuoteLines.length - 1] === "") {
				renderedQuoteLines.pop();
			}

			for (const quoteLine of renderedQuoteLines) {
				const styledLine = applyQuoteStyle(quoteLine);
				const wrappedLines = wrapTextWithAnsi(styledLine, quoteContentWidth);
				for (const wrappedLine of wrappedLines) {
					lines.push(this.theme.quoteBorder("│ ") + wrappedLine);
				}
			}
			if (nextTokenType && nextTokenType !== "space") {
				lines.push("");
			}
		} else if (tokenType === "hr") {
			lines.push(this.theme.hr("─".repeat(Math.min(width, 80))));
			if (nextTokenType && nextTokenType !== "space") {
				lines.push("");
			}
		} else if (tokenType === "html") {
			const htmlRaw = view["raw"];
			if (typeof htmlRaw === "string") {
				lines.push(this.applyDefaultStyle(htmlRaw.trim()));
			}
		} else if (tokenType === "space") {
			lines.push("");
		} else {
			const genericText = view["text"];
			if (typeof genericText === "string") {
				lines.push(genericText);
			}
		}

		return lines;
	}

	private renderInlineTokens(tokens: unknown[], styleContext?: InlineStyleContext): string {
		let result = "";
		const resolvedStyleContext = styleContext ?? this.getDefaultInlineStyleContext();
		const { applyText, stylePrefix } = resolvedStyleContext;
		const applyTextWithNewlines = (text: string): string => {
			const segments: string[] = text.split("\n");
			return segments.map((segment: string) => applyText(segment)).join("\n");
		};

		for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
			// All field access goes through the dyn channel: the compiler's union
			// narrowing writes a retag that lands outside the array element (ASan-
			// confirmed 4-byte heap overflow), so typed switch narrowing is avoided.
			const tokenView = recordViewOf(tokens[tokenIdx]);
			const tokenType = tokenView["type"];

			if (tokenType === "latex") {
				const pending = tokenView["pending"];
				const latexText = tokenView["text"];
				const latexRaw = tokenView["raw"];
				const rendered =
					pending !== true && this.options.renderLatex !== false && typeof latexText === "string"
						? (renderLatex(latexText) ?? (typeof latexRaw === "string" ? latexRaw : ""))
						: typeof latexRaw === "string"
							? latexRaw
							: "";
				result += applyTextWithNewlines(rendered);
			} else if (tokenType === "escape") {
				const escapeText = tokenView["text"];
				result += applyTextWithNewlines(
					this.options.preserveBackslashEscapes
						? typeof tokenView["raw"] === "string"
							? tokenView["raw"]
							: ""
						: typeof escapeText === "string"
							? escapeText
							: "",
				);
			} else if (tokenType === "text") {
				const nested = tokenView["tokens"];
				if (
					nested !== null &&
					nested !== undefined &&
					typeof nested === "object" &&
					(nested as unknown[]).length > 0
				) {
					result += this.renderInlineTokens(nested as unknown[], resolvedStyleContext);
				} else {
					const text = tokenView["text"];
					result += applyTextWithNewlines(typeof text === "string" ? text : "");
				}
			} else if (tokenType === "paragraph") {
				const nested = tokenView["tokens"];
				if (nested !== null && nested !== undefined && typeof nested === "object") {
					result += this.renderInlineTokens(nested as unknown[], resolvedStyleContext);
				}
			} else if (tokenType === "strong") {
				const nested = tokenView["tokens"];
				const boldContent = this.renderInlineTokens(
					nested !== null && nested !== undefined && typeof nested === "object" ? (nested as unknown[]) : [],
					resolvedStyleContext,
				);
				result += this.theme.bold(boldContent) + stylePrefix;
			} else if (tokenType === "em") {
				const nested = tokenView["tokens"];
				const italicContent = this.renderInlineTokens(
					nested !== null && nested !== undefined && typeof nested === "object" ? (nested as unknown[]) : [],
					resolvedStyleContext,
				);
				result += this.theme.italic(italicContent) + stylePrefix;
			} else if (tokenType === "codespan") {
				const codeText = tokenView["text"];
				result += this.theme.code(typeof codeText === "string" ? codeText : "") + stylePrefix;
			} else if (tokenType === "link") {
				const nested = tokenView["tokens"];
				const linkText = this.renderInlineTokens(
					nested !== null && nested !== undefined && typeof nested === "object" ? (nested as unknown[]) : [],
					resolvedStyleContext,
				);
				const styledLink = this.theme.link(this.theme.underline(linkText));
				const href = tokenView["href"];
				const linkOwnText = tokenView["text"];
				if (getCapabilities().hyperlinks) {
					result += hyperlink(styledLink, typeof href === "string" ? href : "") + stylePrefix;
				} else {
					const hrefStr = typeof href === "string" ? href : "";
					const hrefForComparison = hrefStr.startsWith("mailto:") ? hrefStr.slice(7) : hrefStr;
					const ownText = typeof linkOwnText === "string" ? linkOwnText : "";
					if (ownText === hrefStr || ownText === hrefForComparison) {
						result += styledLink + stylePrefix;
					} else {
						result += styledLink + this.theme.linkUrl(` (${hrefStr})`) + stylePrefix;
					}
				}
			} else if (tokenType === "br") {
				result += "\n";
			} else if (tokenType === "del") {
				const nested = tokenView["tokens"];
				const delContent = this.renderInlineTokens(
					nested !== null && nested !== undefined && typeof nested === "object" ? (nested as unknown[]) : [],
					resolvedStyleContext,
				);
				result += this.theme.strikethrough(delContent) + stylePrefix;
			} else if (tokenType === "html") {
				const htmlRaw = tokenView["raw"];
				result += applyTextWithNewlines(typeof htmlRaw === "string" ? htmlRaw : "");
			} else {
				const genericText = tokenView["text"];
				if (typeof genericText === "string") {
					result += applyTextWithNewlines(genericText);
				}
			}
		}

		while (stylePrefix && result.endsWith(stylePrefix)) {
			result = result.slice(0, -stylePrefix.length);
		}

		return result;
	}

	private getOrderedListMarker(item: Record<string, unknown>): string | undefined {
		const raw = item["raw"];
		const match = typeof raw === "string" ? /^(?: {0,3})(\d{1,9}[.)])[ \t]+/.exec(raw) : null;
		return match ? `${match[1]} ` : undefined;
	}

	private getUnorderedListMarker(item: Record<string, unknown>): string | undefined {
		const raw = item["raw"];
		const match = typeof raw === "string" ? /^(?: {0,3})([-+*])(?:[ \t]+|(?=\r?\n|$))/.exec(raw) : null;
		return match ? `${match[1]} ` : undefined;
	}

	/**
	 * Render a list with proper nesting support
	 */
	private renderList(
		token: Record<string, unknown>,
		depth: number,
		width: number,
		styleContext?: InlineStyleContext,
	): string[] {
		const lines: string[] = [];
		const indent = "    ".repeat(depth);
		const rawStart = token["start"];
		const startNumber = typeof rawStart === "number" ? rawStart : 1;
		const ordered = token["ordered"] === true;
		const loose = token["loose"] === true;
		const rawItems = token["items"];
		const items: unknown[] =
			rawItems !== null && rawItems !== undefined && typeof rawItems === "object" ? (rawItems as unknown[]) : [];

		for (let i = 0; i < items.length; i++) {
			const itemView = recordViewOf(items[i]);
			const isLastItem = i === items.length - 1;
			const bullet = ordered
				? this.options.preserveOrderedListMarkers
					? (this.getOrderedListMarker(itemView) ?? `${startNumber + i}. `)
					: `${startNumber + i}. `
				: this.options.preserveOrderedListMarkers
					? (this.getUnorderedListMarker(itemView) ?? "- ")
					: "- ";
			const taskMarker = itemView["task"] === true ? `[${itemView["checked"] === true ? "x" : " "}] ` : "";
			const marker = bullet + taskMarker;
			const firstPrefix = indent + this.theme.listBullet(marker);
			const continuationPrefix = indent + " ".repeat(visibleWidth(marker));
			const itemWidth = Math.max(1, width - visibleWidth(firstPrefix));
			let renderedAnyLine = false;

			const rawItemTokens = itemView["tokens"];
			const itemTokens: unknown[] =
				rawItemTokens !== null && rawItemTokens !== undefined && typeof rawItemTokens === "object"
					? (rawItemTokens as unknown[])
					: [];
			for (let itemTokenIdx = 0; itemTokenIdx < itemTokens.length; itemTokenIdx++) {
				const itemToken = itemTokens[itemTokenIdx];
				if (recordViewOf(itemToken)["type"] === "list") {
					lines.push(...this.renderList(recordViewOf(itemToken), depth + 1, width, styleContext));
					renderedAnyLine = true;
					continue;
				}

				const itemLines = this.renderToken(itemToken, itemWidth, undefined, styleContext);
				for (const line of itemLines) {
					for (const wrappedLine of wrapTextWithAnsi(line, itemWidth)) {
						const linePrefix = renderedAnyLine ? continuationPrefix : firstPrefix;
						lines.push(linePrefix + wrappedLine);
						renderedAnyLine = true;
					}
				}
			}

			if (!renderedAnyLine) {
				lines.push(firstPrefix);
			}

			if (loose && !isLastItem) {
				lines.push("");
			}
		}

		return lines;
	}

	/**
	 * Get the visible width of the longest word in a string.
	 */
	private getLongestWordWidth(text: string, maxWidth?: number): number {
		const words = text.split(/\s+/).filter((word) => word.length > 0);
		let longest = 0;
		for (const word of words) {
			longest = Math.max(longest, visibleWidth(word));
		}
		if (maxWidth === undefined) {
			return longest;
		}
		return Math.min(longest, maxWidth);
	}

	/**
	 * Wrap a table cell to fit into a column.
	 *
	 * Delegates to wrapTextWithAnsi() so ANSI codes + long tokens are handled
	 * consistently with the rest of the renderer.
	 */
	private wrapCellText(text: string, maxWidth: number, stylePrefix = ""): string[] {
		const lines = wrapTextWithAnsi(text, Math.max(1, maxWidth));
		return lines.map((line, index) => {
			// Reset text styles after each non-final fragment, then restore the surrounding style before padding and borders.
			const styleReset = index < lines.length - 1 ? "\x1b[22;23;24;25;27;28;29;39m" : "";
			return `${line}${styleReset}${stylePrefix}`;
		});
	}

	/**
	 * Render a table with width-aware cell wrapping.
	 * Cells that don't fit are wrapped to multiple lines.
	 */
	private renderTable(
		token: Record<string, unknown>,
		availableWidth: number,
		nextTokenType?: string,
		styleContext?: InlineStyleContext,
	): string[] {
		const lines: string[] = [];
		const rawHeader = token["header"];
		const header: unknown[] =
			rawHeader !== null && rawHeader !== undefined && typeof rawHeader === "object" ? (rawHeader as unknown[]) : [];
		const rawRows = token["rows"];
		const rows: unknown[] =
			rawRows !== null && rawRows !== undefined && typeof rawRows === "object" ? (rawRows as unknown[]) : [];
		const tableRaw = token["raw"];
		const tableRawText = typeof tableRaw === "string" ? tableRaw : "";
		const numCols = header.length;

		if (numCols === 0) {
			return lines;
		}

		// Calculate border overhead: "│ " + (n-1) * " │ " + " │"
		// = 2 + (n-1) * 3 + 2 = 3n + 1
		const borderOverhead = 3 * numCols + 1;
		const availableForCells = availableWidth - borderOverhead;
		if (availableForCells < numCols) {
			// Too narrow to render a stable table. Fall back to raw markdown.
			const fallbackLines = tableRawText ? wrapTextWithAnsi(tableRawText, availableWidth) : [];
			if (nextTokenType && nextTokenType !== "space") {
				fallbackLines.push("");
			}
			return fallbackLines;
		}

		const maxUnbrokenWordWidth = 30;

		// Calculate natural column widths (what each column needs without constraints)
		const naturalWidths: number[] = [];
		const minWordWidths: number[] = [];
		for (let i = 0; i < numCols; i++) {
			const headerCellTokens = recordViewOf(header[i])["tokens"];
			const headerCellList =
				headerCellTokens !== null && headerCellTokens !== undefined && typeof headerCellTokens === "object"
					? (headerCellTokens as unknown[])
					: [];
			const headerText = this.renderInlineTokens(headerCellList, styleContext);
			naturalWidths[i] = visibleWidth(headerText);
			minWordWidths[i] = Math.max(1, this.getLongestWordWidth(headerText, maxUnbrokenWordWidth));
		}
		for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
			const row = rows[rowIdx] as unknown[];
			for (let i = 0; i < row.length; i++) {
				const cellTokens = recordViewOf(row[i])["tokens"];
				const cellList =
					cellTokens !== null && cellTokens !== undefined && typeof cellTokens === "object"
						? (cellTokens as unknown[])
						: [];
				const cellText = this.renderInlineTokens(cellList, styleContext);
				naturalWidths[i] = Math.max(naturalWidths[i] ?? 0, visibleWidth(cellText));
				minWordWidths[i] = Math.max(
					minWordWidths[i] ?? 1,
					this.getLongestWordWidth(cellText, maxUnbrokenWordWidth),
				);
			}
		}

		let minColumnWidths = minWordWidths;
		let minCellsWidth = minColumnWidths.reduce((a, b) => a + b, 0);

		if (minCellsWidth > availableForCells) {
			minColumnWidths = [];
			for (let fillIdx = 0; fillIdx < numCols; fillIdx++) minColumnWidths.push(1);
			const remaining = availableForCells - numCols;

			if (remaining > 0) {
				const totalWeight = minWordWidths.reduce((total, width) => total + Math.max(0, width - 1), 0);
				const growth = minWordWidths.map((width) => {
					const weight = Math.max(0, width - 1);
					return totalWeight > 0 ? Math.floor((weight / totalWeight) * remaining) : 0;
				});

				for (let i = 0; i < numCols; i++) {
					minColumnWidths[i] = minColumnWidths[i] + (growth[i] ?? 0);
				}

				const allocated = growth.reduce((total, width) => total + width, 0);
				let leftover = remaining - allocated;
				for (let i = 0; leftover > 0 && i < numCols; i++) {
					minColumnWidths[i] = minColumnWidths[i] + 1;
					leftover--;
				}
			}

			minCellsWidth = minColumnWidths.reduce((a, b) => a + b, 0);
		}

		// Calculate column widths that fit within available width
		const totalNaturalWidth = naturalWidths.reduce((a, b) => a + b, 0) + borderOverhead;
		let columnWidths: number[];

		if (totalNaturalWidth <= availableWidth) {
			// Everything fits naturally
			columnWidths = naturalWidths.map((width, index) => Math.max(width, minColumnWidths[index]));
		} else {
			// Need to shrink columns to fit
			const totalGrowPotential = naturalWidths.reduce((total, width, index) => {
				return total + Math.max(0, width - minColumnWidths[index]);
			}, 0);
			const extraWidth = Math.max(0, availableForCells - minCellsWidth);
			columnWidths = minColumnWidths.map((minWidth, index) => {
				const naturalWidth = naturalWidths[index];
				const minWidthDelta = Math.max(0, naturalWidth - minWidth);
				let grow = 0;
				if (totalGrowPotential > 0) {
					grow = Math.floor((minWidthDelta / totalGrowPotential) * extraWidth);
				}
				return minWidth + grow;
			});

			// Adjust for rounding errors - distribute remaining space
			const allocated = columnWidths.reduce((a, b) => a + b, 0);
			let remaining = availableForCells - allocated;
			while (remaining > 0) {
				let grew = false;
				for (let i = 0; i < numCols && remaining > 0; i++) {
					if (columnWidths[i] < naturalWidths[i]) {
						columnWidths[i] = columnWidths[i] + 1;
						remaining--;
						grew = true;
					}
				}
				if (!grew) {
					break;
				}
			}
		}

		// Render top border
		const topBorderCells = columnWidths.map((w) => "─".repeat(w));
		lines.push(`┌─${topBorderCells.join("─┬─")}─┐`);

		// Render header with wrapping
		const headerCellLines: string[][] = [];
		for (let i = 0; i < header.length; i++) {
			const cellTokens = recordViewOf(header[i])["tokens"];
			const cellList =
				cellTokens !== null && cellTokens !== undefined && typeof cellTokens === "object"
					? (cellTokens as unknown[])
					: [];
			const text = this.renderInlineTokens(cellList, styleContext);
			headerCellLines.push(this.wrapCellText(text, columnWidths[i], styleContext?.stylePrefix));
		}
		const headerLineCount = Math.max(...headerCellLines.map((c) => c.length));

		for (let lineIdx = 0; lineIdx < headerLineCount; lineIdx++) {
			const rowParts = headerCellLines.map((cellLines, colIdx) => {
				const text = cellLines[lineIdx] ?? "";
				const padded = text + " ".repeat(Math.max(0, columnWidths[colIdx] - visibleWidth(text)));
				return this.theme.bold(padded);
			});
			lines.push(`│ ${rowParts.join(" │ ")} │`);
		}

		// Render separator
		const separatorCells = columnWidths.map((w) => "─".repeat(w));
		const separatorLine = `├─${separatorCells.join("─┼─")}─┤`;
		lines.push(separatorLine);

		// Render rows with wrapping
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			const row = rows[rowIndex] as unknown[];
			const rowCellLines: string[][] = [];
			for (let i = 0; i < row.length; i++) {
				const cellTokens = recordViewOf(row[i])["tokens"];
				const cellList =
					cellTokens !== null && cellTokens !== undefined && typeof cellTokens === "object"
						? (cellTokens as unknown[])
						: [];
				const text = this.renderInlineTokens(cellList, styleContext);
				rowCellLines.push(this.wrapCellText(text, columnWidths[i], styleContext?.stylePrefix));
			}
			const rowLineCount = Math.max(...rowCellLines.map((c) => c.length));

			for (let lineIdx = 0; lineIdx < rowLineCount; lineIdx++) {
				const rowParts = rowCellLines.map((cellLines, colIdx) => {
					const text = cellLines[lineIdx] ?? "";
					return text + " ".repeat(Math.max(0, columnWidths[colIdx] - visibleWidth(text)));
				});
				lines.push(`│ ${rowParts.join(" │ ")} │`);
			}

			if (rowIndex < rows.length - 1) {
				lines.push(separatorLine);
			}
		}

		// Render bottom border
		const bottomBorderCells = columnWidths.map((w) => "─".repeat(w));
		lines.push(`└─${bottomBorderCells.join("─┴─")}─┘`);

		if (nextTokenType && nextTokenType !== "space") {
			lines.push(""); // Add spacing after table
		}
		return lines;
	}
}
