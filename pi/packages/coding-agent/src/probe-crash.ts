/**
 * Probe: replicate renderInlineTokens core loop on lexer output.
 * Build: scriptc build packages/coding-agent/src/probe-crash.ts --npm-static string_decoder
 */
import { Marked, type Token, type Tokens } from "../../tui/src/mini-markdown.ts";

function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

function applyText(text: string): string {
	return `<${text}>`;
}

function applyTextWithNewlines(text: string): string {
	const segments: string[] = text.split("\n");
	return segments.map((segment: string) => applyText(segment)).join("\n");
}

function renderInlineTokens(tokens: Token[]): string {
	console.log("  [rt] enter, n =", tokens.length);
	let result = "";
	console.log("  [rt] pre-loop, length =", tokens.length);
	const token0 = tokens[0];
	console.log("  [rt] token0 read, type =", token0.type);
	for (let ti = 0; ti < tokens.length; ti++) {
		const token = tokens[ti];
		console.log("  [rt] loop i =", ti);
		switch (token.type) {
			case "text":
				console.log("  [rt] in text case");
			case "escape":
				result += applyTextWithNewlines(token.raw);
				break;
			case "text":
				if (token.tokens && token.tokens.length > 0) {
					result += renderInlineTokens(token.tokens);
				} else {
					result += applyTextWithNewlines(token.text ?? "");
				}
				break;
			case "strong": {
				result += `[b]${renderInlineTokens(token.tokens ?? [])}[/b]`;
				break;
			}
			case "em": {
				result += `[i]${renderInlineTokens(token.tokens ?? [])}[/i]`;
				break;
			}
			case "codespan": {
				result += `[code]${(token as Tokens.Codespan).text ?? ""}[/code]`;
				break;
			}
			case "del": {
				result += `[s]${renderInlineTokens(token.tokens ?? [])}[/s]`;
				break;
			}
			case "latex": {
				result += "LATEX";
				break;
			}
			default:
				result += applyTextWithNewlines(token.raw);
				break;
		}
	}
	return result;
}

export function main(): void {
	const marked = new Marked();
	console.log("s1: lex");
	const tokens = marked.lexer("你好");
	console.log("s2: block tokens =", tokens.length);
	for (const token of tokens) {
		console.log("s3: render token type =", token.type);
		if (token.type === "paragraph") {
			const inline = token.tokens ?? [];
			console.log("s4: inline tokens =", inline.length);
			const first = inline[0];
			console.log("s4a: read [0] ok");
			const rec = recordViewOf(first);
			console.log("s4b: view type =", rec["type"], "raw:", JSON.stringify(rec["raw"]));
			console.log("s4c: indexed loop over inline");
			for (let k = 0; k < inline.length; k++) {
				const t = inline[k];
				console.log("s4d: iterated token type =", t.type);
			}
			console.log("s4e: pass inline directly to a helper taking Token[] param");
			const out = renderInlineTokens(inline);
			console.log("s5: out =", JSON.stringify(out));
			console.log("s6: push unannotated literal");
			const fresh: Token[] = [];
			fresh.push({ type: "text", raw: "x", text: "x" });
			const out2 = renderInlineTokens(fresh);
			console.log("s7: out2 =", JSON.stringify(out2));
		} else {
			console.log("s3b: non-paragraph, skip");
		}
	}
	console.log("done");
}

main();
