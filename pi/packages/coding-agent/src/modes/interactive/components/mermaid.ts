import type { MermaidRenderingMode } from "../../../core/settings-manager.ts";
import { type MermaidArt, render, type Span } from "../../../utils/mermaid/index.ts";
import type { Theme } from "../theme/theme.ts";
import type { MarkdownTransformer } from "./markdown-transform.ts";

interface MermaidTransformerOptions {
	getMode: () => MermaidRenderingMode;
	theme?: Theme;
}

function codeSpan(line: string): string {
	// Encode each diagram row as inline code (` ... `) so Markdown preserves its spacing and
	// box-drawing characters. Use a non-breaking space for blank rows because an
	// empty code span has no visible height.
	const content = line || "\u00a0";
	// CommonMark code spans use matching backtick delimiters, so choose one
	// longer than any backtick run in the content (``hel`lo`` -> <code>hel`lo</code>).
	// If the content starts or ends with a backtick, separating it from the
	// delimiter with a space keeps that backtick as content; CommonMark removes
	// the padding when rendering (`` `edge` `` -> <code>`edge`</code>).
	// Mermaid labels can preserve backticks, for example:
	//   `┌──────────────┐    ┌──────────────┐`
	// ```│ plain ` tick ├───▶│ two `` ticks │```
	//   `└──────────────┘    └──────────────┘`
	let longestBacktickRun = 0;
	for (const match of content.matchAll(/`+/g)) {
		if (match[0].length > longestBacktickRun) longestBacktickRun = match[0].length;
	}
	const fence = "`".repeat(longestBacktickRun + 1);
	const padding = content.startsWith("`") || content.endsWith("`") ? " " : "";
	return `${fence}${padding}${content}${padding}${fence}`;
}

function styleSpan(span: Span, theme: Theme): string {
	switch (span.cls) {
		case "border":
			return theme.fg("borderMuted", span.text);
		case "text":
			return theme.fg("text", span.text);
		case "edge":
			return theme.fg("accent", span.text);
		case "edgeLabel":
			return theme.fg("muted", span.text);
		case "title":
			return theme.fg("accent", theme.bold(span.text));
		case "none":
			return span.text;
		default:
			return span.text;
	}
}

function themedLines(art: MermaidArt, theme: Theme): string[] {
	return art.styled.map((row) => row.map((span) => styleSpan(span, theme)).join(""));
}

/** Create a transformer that replaces top-level Mermaid code blocks with Unicode terminal diagrams. */
export function createMermaidMarkdownTransformer(options: MermaidTransformerOptions): MarkdownTransformer {
	return (markdown, context) => {
		const mode = options.getMode();
		if (
			mode === "off" ||
			context.messageType === "assistant-thinking" ||
			(context.isStreaming && mode !== "streaming")
		) {
			return markdown;
		}
		const lines = markdown.split("\n");
		const out: string[] = [];
		let i = 0;
		while (i < lines.length) {
			const line = lines[i] ?? "";
			const open = /^(`{3,})mermaid[ \t]*$/.exec(line);
			if (open === null) {
				out.push(line);
				i += 1;
				continue;
			}
			const fenceMark = open[1] ?? "```";
			// CommonMark: content lines are dedented by the opening fence's own
			// indentation. The upstream transformer got this from the marked
			// lexer; the renderer indexes label/canvas arrays by computed
			// columns, so indented input must be dedented or layout reads run
			// out of bounds (an uncatchable scriptc trap).
			const fenceIndent = (open[0].match(/^ */) ?? [""])[0]?.length ?? 0;
			let close = -1;
			for (let j = i + 1; j < lines.length; j++) {
				const candidate = lines[j] ?? "";
				const candidateTrim =
					fenceIndent > 0 ? candidate.replace(new RegExp(`^ {1,${fenceIndent}}`), "") : candidate;
				if (candidateTrim === fenceMark || candidate.trim() === fenceMark) {
					close = j;
					break;
				}
			}
			if (close === -1) {
				out.push(line);
				i += 1;
				continue;
			}
			const code = lines
				.slice(i + 1, close)
				.map((contentLine) =>
					fenceIndent > 0 ? contentLine.replace(new RegExp(`^ {1,${fenceIndent}}`), "") : contentLine,
				)
				.join("\n");
			const art = render(code);
			if (art === null || art.width > context.availableWidth) {
				for (let j = i; j <= close; j++) out.push(lines[j] ?? "");
				i = close + 1;
				continue;
			}
			for (let j = i; j <= close; j++) out.push(lines[j] ?? "");
			if (!context.isStreaming && art.warnings.length > 0) {
				const suffix = art.warnings.length > 1 ? ` (+${art.warnings.length - 1} more)` : "";
				const warning = `Mermaid diagram not rendered: ${art.warnings[0]}${suffix}`;
				out.push(options.theme ? options.theme.fg("warning", warning) : warning);
			} else {
				for (const row of options.theme ? themedLines(art, options.theme) : art.plain) out.push(row);
			}
			i = close + 1;
		}
		return out.join("\n");
	};
}
