/**
 * Minimal markdown lexer replacing the marked package (its shipped bundle is minified and
 * cannot compile statically). Produces the Token shapes the TUI Markdown component consumes:
 * block tokens (heading/code/table/blockquote/list/paragraph/hr/html/space/text) with nested
 * inline tokens (strong/em/del/codespan/link/image/escape/html/br/text), plus the Tokenizer
 * extension hooks (custom del tokenizer, latex block extension) and partial-fence semantics
 * the component relies on during streaming.
 */

export interface TokenBase {
	type: string;
	raw: string;
}

export interface TokensGeneric extends TokenBase {
	text?: string;
	tokens?: Token[];
	[key: string]: unknown;
}

export interface TokensSpace extends TokenBase {
	type: "space";
	raw: string;
}

export interface TokensHr extends TokenBase {
	type: "hr";
	raw: string;
}

export interface TokensHeading extends TokenBase {
	type: "heading";
	depth: number;
	text: string;
	tokens: Token[];
}

export interface TokensCode extends TokenBase {
	type: "code";
	lang?: string;
	text: string;
	codeBlockStyle?: string;
}

export interface TokensTableCell {
	text: string;
	tokens: Token[];
	header: boolean;
	align: "center" | "left" | "right" | null;
}

export interface TokensTable extends TokenBase {
	type: "table";
	header: TokensTableCell[];
	rows: TokensTableCell[][];
	align: ("center" | "left" | "right" | null)[];
}

export interface TokensBlockquote extends TokenBase {
	type: "blockquote";
	text: string;
	tokens: Token[];
}

export interface TokensCheckbox extends TokenBase {
	type: "checkbox";
	raw: string;
	checked: boolean;
}

export interface TokensListItem {
	type: "list_item";
	raw: string;
	task: boolean;
	loose: boolean;
	text: string;
	tokens: Token[];
	checked?: boolean;
}

export interface TokensList extends TokenBase {
	type: "list";
	ordered: boolean;
	start: number | "";
	loose: boolean;
	items: TokensListItem[];
}

export interface TokensParagraph extends TokenBase {
	type: "paragraph";
	text: string;
	tokens: Token[];
}

export interface TokensHtml extends TokenBase {
	type: "html";
	text: string;
	block?: boolean;
	pre?: boolean;
}

export interface TokensText extends TokenBase {
	type: "text";
	text: string;
	tokens?: Token[];
	escaped?: boolean;
}

export interface TokensDef extends TokenBase {
	type: "def";
	tag: string;
	href: string;
	title: string;
}

export interface TokensEscape extends TokenBase {
	type: "escape";
	text: string;
}

export interface TokensStrong extends TokenBase {
	type: "strong";
	text: string;
	tokens: Token[];
}

export interface TokensEm extends TokenBase {
	type: "em";
	text: string;
	tokens: Token[];
}

export interface TokensDel extends TokenBase {
	type: "del";
	text: string;
	tokens: Token[];
}

export interface TokensCodespan extends TokenBase {
	type: "codespan";
	text: string;
}

export interface TokensLink extends TokenBase {
	type: "link";
	href: string;
	title?: string | null;
	text: string;
	tokens: Token[];
}

export interface TokensImage extends TokenBase {
	type: "image";
	href: string;
	title?: string | null;
	text: string;
	tokens?: Token[];
}

export interface TokensBr extends TokenBase {
	type: "br";
	raw: string;
}

export interface TokensLatex extends TokenBase {
	type: "latex" | "latexBlock";
	text?: string;
	pending?: boolean;
}

export type Token =
	| TokensSpace
	| TokensCheckbox
	| TokensHr
	| TokensHeading
	| TokensCode
	| TokensTable
	| TokensBlockquote
	| TokensList
	| TokensParagraph
	| TokensHtml
	| TokensText
	| TokensDef
	| TokensEscape
	| TokensStrong
	| TokensEm
	| TokensDel
	| TokensCodespan
	| TokensLink
	| TokensImage
	| TokensBr
	| TokensLatex;

export namespace Tokens {
	export type Generic = TokensGeneric;
	export type Del = TokensDel;
	export type List = TokensList;
	export type ListItem = TokensListItem;
	export type Table = TokensTable;
	export type Text = TokensText;
	export type Heading = TokensHeading;
	export type Code = TokensCode;
	export type Paragraph = TokensParagraph;
	export type Codespan = TokensCodespan;
	export type Link = TokensLink;
	export type Strong = TokensStrong;
	export type Em = TokensEm;
}

export interface TokenizerExtension {
	name: string;
	level: "block" | "inline";
	start?: (source: string) => number | undefined;
	tokenizer: (source: string, tokens: Token[]) => Token | TokensGeneric | undefined;
}

export interface MarkedExtension {
	extensions?: TokenizerExtension[];
	tokenizer?: Tokenizer;
	[key: string]: unknown;
}

export class Tokenizer {
	lexer: Lexer | undefined;

	inlineTokens(text: string): Token[] {
		if (this.lexer) return this.lexer.inlineTokens(text);
		return [];
	}

	del(_source: string): TokensDel | undefined {
		return undefined;
	}
}

export interface MarkedOptions {
	tokenizer?: Tokenizer;
	[key: string]: unknown;
}

const HEADING_PATTERN = /^(#{1,6})(?:\s+|$)([^\n]*?)(?:\n+|$)/;
const HR_PATTERN =
	/^(?: {0,3}(?:-[ \t]*){3,}(?:\n+|$)|(?: {0,3}(?:\*[ \t]*){3,}(?:\n+|$)|(?: {0,3}(?:_[ \t]*){3,}(?:\n+|$))))/;
const FENCE_PATTERN = /^( {0,3})(`{3,}|~{3,})[ \t]*([^\n`]*)\n?/;
const BLOCKQUOTE_PATTERN = /^ {0,3}>/;
const LIST_PATTERN = /^( {0,3})([*+-]|\d{1,9}[.)])([ \t]+|$)/;
const HTML_BLOCK_PATTERN = /^ {0,3}<(?:[a-zA-Z][a-zA-Z0-9-]*|!--|\/)/;
const INDENTED_CODE_PATTERN = /^(?: {4}| {0,3}\t)/;
const BLANK_PATTERN = /^[ \t]*$/;

function unescapeMarkdown(text: string): string {
	return text.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, "$1");
}

function splitTableCells(line: string): string[] {
	const cells: string[] = [];
	let current = "";
	let inCode = false;
	for (let index = 0; index < line.length; index += 1) {
		const char = line[index];
		if (char === "`") inCode = !inCode;
		if (char === "\\" && line[index + 1] === "|") {
			current += "|";
			index += 1;
			continue;
		}
		if (char === "|" && !inCode) {
			cells.push(current);
			current = "";
			continue;
		}
		current += char;
	}
	cells.push(current);
	if (cells.length > 0 && cells[0].trim() === "") cells.shift();
	if (cells.length > 0 && cells[cells.length - 1].trim() === "") cells.pop();
	return cells;
}

function isAsciiAlnum(char: string): boolean {
	const code = char.charCodeAt(0);
	return (code >= 97 && code <= 122) || (code >= 65 && code <= 90) || (code >= 48 && code <= 57);
}

class InlineLexer {
	private extensions: TokenizerExtension[];
	private customTokenizer: Tokenizer | undefined;

	constructor(extensions: TokenizerExtension[], customTokenizer: Tokenizer | undefined) {
		this.extensions = extensions.filter((extension) => extension.level === "inline");
		this.customTokenizer = customTokenizer;
	}

	lex(text: string): Token[] {
		return this.inlineTokens(text);
	}

	inlineTokens(text: string): Token[] {
		const tokens: Token[] = [];
		let position = 0;
		let plain = "";
		const flushPlain = (): void => {
			if (plain !== "") {
				tokens.push({ type: "text", raw: plain, text: plain });
				plain = "";
			}
		};
		while (position < text.length) {
			const rest = text.slice(position);
			let handled = false;
			for (const extension of this.extensions) {
				if (!extension.tokenizer) continue;
				const produced = extension.tokenizer(rest, tokens);
				if (produced) {
					flushPlain();
					tokens.push(produced as Token);
					position += produced.raw.length;
					handled = true;
					break;
				}
			}
			if (handled) continue;
			// CommonMark intra-word rule for underscore delimiters: a `_` run that is
			// both preceded and followed by an alphanumeric character can neither open
			// nor close emphasis, so `alpha_beta` stays literal (asterisks have no
			// such restriction).
			const prevIsAlnum = position > 0 && isAsciiAlnum(text[position - 1]);
			const escapeMatch = /^\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/.exec(rest);
			if (escapeMatch) {
				flushPlain();
				tokens.push({ type: "escape", raw: escapeMatch[0], text: escapeMatch[1] });
				position += escapeMatch[0].length;
				continue;
			}
			const codespanMatch = /^(`+)([\s\S]*?[^`])\1(?!`)/.exec(rest);
			if (codespanMatch) {
				flushPlain();
				let codeText = codespanMatch[2].replace(/\n/g, " ");
				if (codeText.startsWith(" ") && codeText.endsWith(" ") && codeText.trim() !== "") {
					codeText = codeText.slice(1, -1);
				}
				tokens.push({ type: "codespan", raw: codespanMatch[0], text: codeText });
				position += codespanMatch[0].length;
				continue;
			}
			if (this.customTokenizer && rest.startsWith("~~")) {
				const delToken = this.customTokenizer.del(rest);
				if (delToken) {
					flushPlain();
					tokens.push(delToken);
					position += delToken.raw.length;
					continue;
				}
			}
			const delMatch = /^~~(?=\S)([\s\S]*?\S)~~/.exec(rest);
			if (delMatch) {
				flushPlain();
				tokens.push({ type: "del", raw: delMatch[0], text: delMatch[1], tokens: this.inlineTokens(delMatch[1]) });
				position += delMatch[0].length;
				continue;
			}
			const strongEmMatch = /^(\*\*\*|___)(?=\S)([\s\S]*?\S)\1/.exec(rest);
			if (strongEmMatch && (strongEmMatch[1] === "***" || !prevIsAlnum)) {
				flushPlain();
				tokens.push({
					type: "strong",
					raw: strongEmMatch[0],
					text: strongEmMatch[2],
					tokens: this.inlineTokens(strongEmMatch[2]),
				});
				position += strongEmMatch[0].length;
				continue;
			}
			const strongStarMatch = /^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*\*|[*_])/.exec(rest);
			if (strongStarMatch) {
				flushPlain();
				tokens.push({
					type: "strong",
					raw: strongStarMatch[0],
					text: strongStarMatch[1],
					tokens: this.inlineTokens(strongStarMatch[1]),
				});
				position += strongStarMatch[0].length;
				continue;
			}
			const strongUnderscoreMatch = !prevIsAlnum ? /^__(?=\S)([\s\S]*?\S)__(?![a-zA-Z0-9_*])/.exec(rest) : undefined;
			if (strongUnderscoreMatch) {
				flushPlain();
				tokens.push({
					type: "strong",
					raw: strongUnderscoreMatch[0],
					text: strongUnderscoreMatch[1],
					tokens: this.inlineTokens(strongUnderscoreMatch[1]),
				});
				position += strongUnderscoreMatch[0].length;
				continue;
			}
			const emStarMatch = /^\*(?=\S)([\s\S]*?\S)\*/.exec(rest);
			if (emStarMatch) {
				flushPlain();
				tokens.push({
					type: "em",
					raw: emStarMatch[0],
					text: emStarMatch[1],
					tokens: this.inlineTokens(emStarMatch[1]),
				});
				position += emStarMatch[0].length;
				continue;
			}
			const emUnderscoreMatch = !prevIsAlnum ? /^_(?=\S)([\s\S]*?\S)_(?![a-zA-Z0-9])/.exec(rest) : undefined;
			if (emUnderscoreMatch) {
				flushPlain();
				tokens.push({
					type: "em",
					raw: emUnderscoreMatch[0],
					text: emUnderscoreMatch[1],
					tokens: this.inlineTokens(emUnderscoreMatch[1]),
				});
				position += emUnderscoreMatch[0].length;
				continue;
			}
			const imageMatch =
				/^!\[([^\]]*)\]\(([ \t]*)(?:<([^<>]*)>|([^)) \t]*))(?:[ \t]+(?:"([^"]*)"|'([^']*)'|\(([^()]*)\)))?[ \t]*\)/.exec(
					rest,
				);
			if (imageMatch) {
				flushPlain();
				tokens.push({
					type: "image",
					raw: imageMatch[0],
					text: imageMatch[1],
					href: imageMatch[3] ?? imageMatch[4] ?? "",
					title: imageMatch[5] ?? imageMatch[6] ?? imageMatch[7] ?? null,
					tokens: this.inlineTokens(imageMatch[1]),
				});
				position += imageMatch[0].length;
				continue;
			}
			const linkMatch =
				/^\[([^\]]*)\]\(([ \t]*)(?:<([^<>]*)>|([^)) \t]*))(?:[ \t]+(?:"([^"]*)"|'([^']*)'|\(([^()]*)\)))?[ \t]*\)/.exec(
					rest,
				);
			if (linkMatch) {
				flushPlain();
				const linkText = linkMatch[1];
				tokens.push({
					type: "link",
					raw: linkMatch[0],
					text: linkText,
					href: linkMatch[3] ?? linkMatch[4] ?? "",
					title: linkMatch[5] ?? linkMatch[6] ?? linkMatch[7] ?? null,
					tokens: this.inlineTokens(linkText),
				});
				position += linkMatch[0].length;
				continue;
			}
			const autolinkMatch = /^<([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^\s<>]*)>/.exec(rest);
			if (autolinkMatch) {
				flushPlain();
				const url = autolinkMatch[1];
				const urlText: TokensText = { type: "text", raw: url, text: url };
				const autolinkToken: TokensLink = {
					type: "link",
					raw: autolinkMatch[0],
					text: url,
					href: url,
					tokens: [urlText],
				};
				tokens.push(autolinkToken);
				position += autolinkMatch[0].length;
				continue;
			}
			const htmlMatch = /^<[a-zA-Z!?/][^\n<>]*>/.exec(rest);
			if (htmlMatch) {
				flushPlain();
				tokens.push({ type: "html", raw: htmlMatch[0], text: htmlMatch[0] });
				position += htmlMatch[0].length;
				continue;
			}
			const brMatch = /^[ \t]{2,}\n|^ {2,}\n/.exec(rest);
			if (brMatch && rest.startsWith(brMatch[0])) {
				flushPlain();
				tokens.push({ type: "br", raw: brMatch[0] });
				position += brMatch[0].length;
				continue;
			}
			const first = text.charCodeAt(position);
			if (first >= 0xd800 && first <= 0xdbff && position + 1 < text.length) {
				const second = text.charCodeAt(position + 1);
				if (second >= 0xdc00 && second <= 0xdfff) {
					plain += text.slice(position, position + 2);
					position += 2;
					continue;
				}
			}
			plain += text[position];
			position += 1;
		}
		flushPlain();
		return tokens;
	}
}

export class Lexer {
	private extensions: TokenizerExtension[];
	private customTokenizer: Tokenizer | undefined;
	private inline: InlineLexer;

	constructor(extensions: TokenizerExtension[], customTokenizer: Tokenizer | undefined) {
		this.extensions = extensions.filter((extension) => extension.level === "block");
		this.customTokenizer = customTokenizer;
		if (this.customTokenizer) this.customTokenizer.lexer = this;
		this.inline = new InlineLexer(extensions, customTokenizer);
	}

	inlineTokens(text: string): Token[] {
		return this.inline.inlineTokens(text);
	}

	lex(source: string): Token[] {
		const tokens: Token[] = [];
		const text = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
		const lines = text.split("\n");
		let index = 0;
		while (index < lines.length) {
			const line = lines[index];
			if (BLANK_PATTERN.test(line)) {
				if (index < lines.length - 1) tokens.push({ type: "space", raw: `${line}\n` });
				index += 1;
				continue;
			}
			const extensionStart = this.findExtensionStart(lines, index);
			if (extensionStart >= 0) {
				const consumed = this.runExtensionTokenizer(lines, index);
				if (consumed) {
					tokens.push(consumed.token);
					index = consumed.next;
					continue;
				}
			}
			void extensionStart;
			const fenceMatch = FENCE_PATTERN.exec(line);
			if (fenceMatch) {
				const fence = fenceMatch[2];
				const lang = fenceMatch[3].trim().split(/\s+/)[0] ?? "";
				const codeLines: string[] = [];
				let cursor = index + 1;
				let closed = false;
				while (cursor < lines.length) {
					const closeMatch = new RegExp(`^ {0,3}${fence[0] === "`" ? "`" : "~"}{${fence.length},}[ \\t]*$`).exec(
						lines[cursor],
					);
					if (closeMatch) {
						closed = true;
						cursor += 1;
						break;
					}
					codeLines.push(lines[cursor]);
					cursor += 1;
				}
				const rawLines = lines.slice(index, cursor);
				tokens.push({
					type: "code",
					raw: closed ? `${rawLines.join("\n")}\n` : rawLines.join("\n"),
					lang: lang === "" ? undefined : unescapeMarkdown(lang),
					text: codeLines.join("\n"),
					codeBlockStyle: "indented",
				});
				index = cursor;
				continue;
			}
			const headingMatch = HEADING_PATTERN.exec(`${line}\n`);
			if (headingMatch) {
				const text2 = headingMatch[2].replace(/[ \t]*#+[ \t]*$/, "").trim();
				tokens.push({
					type: "heading",
					raw: `${line}\n`,
					depth: headingMatch[1].length,
					text: text2,
					tokens: this.inline.inlineTokens(text2),
				});
				index += 1;
				continue;
			}
			if (HR_PATTERN.test(`${line}\n`) && !LIST_PATTERN.test(line)) {
				tokens.push({ type: "hr", raw: `${line}\n` });
				index += 1;
				continue;
			}
			if (BLOCKQUOTE_PATTERN.test(line)) {
				const quoteLines: string[] = [];
				let cursor = index;
				while (
					cursor < lines.length &&
					(BLOCKQUOTE_PATTERN.test(lines[cursor]) ||
						(lines[cursor] !== "" &&
							quoteLines.length > 0 &&
							!BLANK_PATTERN.test(lines[cursor - 1]) &&
							!this.startsBlock(lines[cursor])))
				) {
					quoteLines.push(lines[cursor].replace(/^ {0,3}>[ \t]?/, ""));
					cursor += 1;
				}
				const quoteText = quoteLines.join("\n");
				tokens.push({
					type: "blockquote",
					raw: `${lines.slice(index, cursor).join("\n")}\n`,
					text: quoteText,
					tokens: this.lex(quoteText),
				});
				index = cursor;
				continue;
			}
			const listMatch = LIST_PATTERN.exec(line);
			if (listMatch) {
				const consumed = this.lexList(lines, index, listMatch);
				if (consumed) {
					tokens.push(consumed.token);
					index = consumed.next;
					continue;
				}
			}
			if (
				line.includes("|") &&
				index + 1 < lines.length &&
				/^[ \t]*\|?[ :|-]+\|?[ :|-]*$/.test(lines[index + 1]) &&
				lines[index + 1].includes("-")
			) {
				const table = this.lexTable(lines, index);
				if (table) {
					tokens.push(table.token);
					index = table.next;
					continue;
				}
			}
			if (HTML_BLOCK_PATTERN.test(line) && line.trim().startsWith("<")) {
				const htmlLines: string[] = [];
				let cursor = index;
				while (cursor < lines.length && !BLANK_PATTERN.test(lines[cursor])) {
					htmlLines.push(lines[cursor]);
					cursor += 1;
				}
				const htmlText = htmlLines.join("\n");
				tokens.push({ type: "html", raw: htmlText, text: htmlText, block: true, pre: false });
				index = cursor;
				continue;
			}
			if (INDENTED_CODE_PATTERN.test(line)) {
				const codeLines: string[] = [];
				let cursor = index;
				while (
					cursor < lines.length &&
					(INDENTED_CODE_PATTERN.test(lines[cursor]) || BLANK_PATTERN.test(lines[cursor]))
				) {
					codeLines.push(BLANK_PATTERN.test(lines[cursor]) ? "" : lines[cursor].slice(4));
					cursor += 1;
				}
				while (codeLines.length > 0 && codeLines[codeLines.length - 1] === "") codeLines.pop();
				tokens.push({
					type: "code",
					raw: `${lines.slice(index, cursor).join("\n")}\n`,
					lang: undefined,
					text: codeLines.join("\n"),
					codeBlockStyle: "indented",
				});
				index = cursor;
				continue;
			}
			const paragraphLines: string[] = [];
			let paragraphCursor = index;
			while (
				paragraphCursor < lines.length &&
				!BLANK_PATTERN.test(lines[paragraphCursor]) &&
				!this.startsBlock(lines[paragraphCursor])
			) {
				paragraphLines.push(lines[paragraphCursor]);
				paragraphCursor += 1;
			}
			if (paragraphLines.length === 0) {
				index += 1;
				continue;
			}
			const paragraphText = paragraphLines.join("\n");
			tokens.push({
				type: "paragraph",
				raw: `${paragraphLines.join("\n")}\n`,
				text: paragraphText,
				tokens: this.inline.inlineTokens(paragraphText),
			});
			index = paragraphCursor;
		}
		return tokens;
	}

	private startsBlock(line: string): boolean {
		return (
			HEADING_PATTERN.test(`${line}\n`) ||
			FENCE_PATTERN.test(line) ||
			HR_PATTERN.test(`${line}\n`) ||
			BLOCKQUOTE_PATTERN.test(line) ||
			LIST_PATTERN.test(line) ||
			(HTML_BLOCK_PATTERN.test(line.trimStart()) === true && line.trimStart().startsWith("<"))
		);
	}

	private findExtensionStart(lines: string[], index: number): number {
		void lines;
		void index;
		return 0;
	}

	private runExtensionTokenizer(lines: string[], index: number): { token: Token; next: number } | undefined {
		const rest = `${lines.slice(index).join("\n")}\n`;
		for (const extension of this.extensions) {
			if (!extension.tokenizer) continue;
			const produced = extension.tokenizer(rest, []);
			if (produced) {
				const consumedLines = produced.raw.endsWith("\n")
					? produced.raw.split("\n").length - 1
					: produced.raw.split("\n").length;
				return { token: produced as Token, next: index + Math.max(1, consumedLines) };
			}
		}
		return undefined;
	}

	private lexList(
		lines: string[],
		index: number,
		firstMatch: RegExpExecArray,
	): { token: Token; next: number } | undefined {
		const ordered = /\d/.test(firstMatch[2]);
		const startValue = ordered ? Number(firstMatch[2].slice(0, -1)) : "";
		const items: TokensListItem[] = [];
		let cursor = index;
		const markerIndent = firstMatch[1].length;
		const itemIndents: number[] = [];
		while (cursor < lines.length) {
			const line = lines[cursor];
			if (BLANK_PATTERN.test(line)) {
				if (cursor + 1 < lines.length && LIST_PATTERN.test(lines[cursor + 1])) {
					cursor += 1;
					continue;
				}
				break;
			}
			const match = LIST_PATTERN.exec(line);
			if (match) {
				if (cursor > index && match[1].length <= markerIndent && match[2] !== firstMatch[2] && !ordered) break;
				if (cursor > index && match[1].length === 0 && markerIndent === 0) {
					const sameMarker = ordered === /\d/.test(match[2]);
					if (!sameMarker) break;
				}
				const contentIndent = match[1].length + match[2].length + match[3].length;
				itemIndents.push(contentIndent);
				const itemLines: string[] = [line.slice(contentIndent)];
				cursor += 1;
				while (cursor < lines.length) {
					const next = lines[cursor];
					if (BLANK_PATTERN.test(next)) {
						if (
							cursor + 1 < lines.length &&
							!BLANK_PATTERN.test(lines[cursor + 1]) &&
							(LIST_PATTERN.test(lines[cursor + 1]) ?? false)
						) {
							if (LIST_PATTERN.exec(lines[cursor + 1])?.[1].length === 0) break;
							itemLines.push("");
							cursor += 1;
							continue;
						}
						break;
					}
					const nested = LIST_PATTERN.exec(next);
					if (
						nested &&
						nested[1].length <= markerIndent &&
						(cursor + 1 >= lines.length || !LIST_PATTERN.test(next))
					)
						break;
					if (nested && nested[1].length === 0) break;
					itemLines.push(next.slice(Math.min(contentIndent, next.length)));
					cursor += 1;
				}
				let itemText = itemLines.join("\n");
				itemText = itemText.replace(/\n$/, "");
				const firstLine = itemText.split("\n")[0].trimStart();
				const taskMatch = /^\[([ xX])\][ \t]+/.exec(firstLine);
				const task = taskMatch !== null;
				let checked: boolean | undefined;
				if (task) {
					checked = taskMatch[1] !== " ";
				}
				const strippedText = task ? itemText.replace(/^\[[ xX]\][ \t]+/, "") : itemText;
				const loose = false;
				items.push({
					type: "list_item",
					raw: `${itemLines.join("\n")}`,
					task,
					loose,
					text: strippedText,
					tokens: [],
					checked,
				});
				continue;
			}
			break;
		}
		if (items.length === 0) return undefined;
		for (const item of items) {
			const blockTokens = this.lex(item.text);
			const mapped: Token[] = blockTokens.map((token): Token => {
				if (token.type === "paragraph") {
					return { type: "text", raw: token.raw, text: token.text, tokens: token.tokens };
				}
				return token;
			});
			if (item.task) {
				const checkbox: TokensCheckbox = {
					type: "checkbox",
					raw: item.checked ? "[x] " : "[ ] ",
					checked: item.checked === true,
				};
				mapped.unshift(checkbox);
			}
			item.tokens = mapped;
		}
		const raw = lines
			.slice(index, cursor)
			.filter((line) => !BLANK_PATTERN.test(line) || cursor < lines.length)
			.join("\n");
		void raw;
		const itemRaw = items.map((item) => item.raw).join("");
		return {
			token: {
				type: "list",
				raw: itemRaw,
				ordered,
				start: ordered ? startValue : "",
				loose: false,
				items,
			},
			next: cursor,
		};
	}

	private lexTable(lines: string[], index: number): { token: Token; next: number } | undefined {
		const headerCells = splitTableCells(lines[index]);
		const alignCells = splitTableCells(lines[index + 1]);
		if (headerCells.length === 0 || alignCells.length !== headerCells.length) return undefined;
		const align: ("center" | "left" | "right" | null)[] = alignCells.map((cell) => {
			const trimmed = cell.trim();
			const left = trimmed.startsWith(":");
			const right = trimmed.endsWith(":");
			if (left && right) return "center";
			if (right) return "right";
			if (left) return "left";
			return null;
		});
		const header: TokensTableCell[] = headerCells.map((cell) => ({
			text: cell.trim(),
			tokens: this.inline.inlineTokens(cell.trim()),
			header: true,
			align: null,
		}));
		const rows: TokensTableCell[][] = [];
		let cursor = index + 2;
		while (cursor < lines.length && lines[cursor].includes("|") && !BLANK_PATTERN.test(lines[cursor])) {
			const rowCells = splitTableCells(lines[cursor]);
			rows.push(
				rowCells.map((cell, cellIndex) => ({
					text: cell.trim(),
					tokens: this.inline.inlineTokens(cell.trim()),
					header: false,
					align: align[cellIndex] ?? null,
				})),
			);
			cursor += 1;
		}
		return {
			token: {
				type: "table",
				raw: `${lines.slice(index, cursor).join("\n")}\n`,
				header,
				rows,
				align,
			},
			next: cursor,
		};
	}
}

export class Marked {
	private extensions: TokenizerExtension[] = [];
	private customTokenizer: Tokenizer | undefined;

	setOptions(options: MarkedOptions): this {
		if (options.tokenizer) this.customTokenizer = options.tokenizer;
		return this;
	}

	use(extension: MarkedExtension): this {
		if (extension.extensions) {
			this.extensions = this.extensions.concat(extension.extensions);
		}
		if (extension.tokenizer) this.customTokenizer = extension.tokenizer as unknown as Tokenizer;
		return this;
	}

	lexer(source: string): Token[] {
		const lexer = new Lexer(this.extensions, this.customTokenizer);
		return lexer.lex(source);
	}

	parseInline(source: string): Token[] {
		const lexer = new Lexer(this.extensions, this.customTokenizer);
		return lexer.inlineTokens(source);
	}
}
