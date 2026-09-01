/**
 * Probe: full Markdown.render on user message content (empty-glyph diagnosis).
 * Build: scriptc build packages/coding-agent/src/probe-crash.ts --npm-static string_decoder
 */
import { Markdown } from "../../tui/src/components/markdown.ts";
import { getMarkdownTheme, initTheme, theme } from "./modes/interactive/theme/theme.ts";

export function main(): void {
	initTheme("dark", false);
	console.log("theme ok, fg accent:", JSON.stringify(theme.fg("accent", "T")));

	const md = new Markdown("你好", 0, 0, getMarkdownTheme(), {
		color: (content: string) => theme.fg("userMessageText", content),
	});
	const lines = md.render(80);
	console.log("render lines:", lines.length);
	for (const line of lines) {
		console.log(JSON.stringify(line));
	}
	console.log("done");
}

main();
