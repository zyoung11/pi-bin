import { Box } from "../../../../../tui/src/components/box.ts";
import { Markdown, type MarkdownTheme } from "../../../../../tui/src/components/markdown.ts";
import { Spacer } from "../../../../../tui/src/components/spacer.ts";
import { Text } from "../../../../../tui/src/components/text.ts";
import type { CompactionSummaryMessage } from "../../../core/messages.ts";
import { getMarkdownTheme, theme } from "../theme/theme.ts";
import { keyText } from "./keybinding-hints.ts";

/** Format a token count with thousands separators, matching the default locale grouping of toLocaleString. */
function formatTokenCount(value: number): string {
	const whole = Math.floor(Math.abs(value)).toString();
	let out = "";
	let count = 0;
	for (let i = whole.length - 1; i >= 0; i--) {
		out = whole[i] + out;
		count++;
		if (count % 3 === 0 && i > 0) out = "," + out;
	}
	return (value < 0 ? "-" : "") + out;
}

/**
 * Component that renders a compaction message with collapsed/expanded state.
 * Uses same background color as custom messages for visual consistency.
 */
export class CompactionSummaryMessageComponent extends Box {
	private expanded = false;
	private message: CompactionSummaryMessage;
	private markdownTheme: MarkdownTheme;

	constructor(message: CompactionSummaryMessage, markdownTheme: MarkdownTheme = getMarkdownTheme()) {
		super(1, 1, (t) => theme.bg("customMessageBg", t));
		this.message = message;
		this.markdownTheme = markdownTheme;
		this.updateDisplay();
	}

	setExpanded(expanded: boolean): void {
		this.expanded = expanded;
		this.updateDisplay();
	}

	/**
	 * Content changes flow through explicit setters that call updateDisplay;
	 * invalidation only needs to clear child caches, which the markdown render
	 * epoch and per-component cache keys already handle.
	 */
	override invalidate(): void {
		super.invalidate();
	}

	private updateDisplay(): void {
		this.clear();

		const tokenStr = formatTokenCount(this.message.tokensBefore);
		const label = theme.fg("customMessageLabel", `\x1b[1m[compaction]\x1b[22m`);
		this.addChild(new Text(label, 0, 0));
		this.addChild(new Spacer(1));

		if (this.expanded) {
			const header = `**Compacted from ${tokenStr} tokens**\n\n`;
			this.addChild(
				new Markdown(header + this.message.summary, 0, 0, this.markdownTheme, {
					color: (text: string) => theme.fg("customMessageText", text),
				}),
			);
		} else {
			this.addChild(
				new Text(
					theme.fg("customMessageText", `Compacted from ${tokenStr} tokens (`) +
						theme.fg("dim", keyText("app.tools.expand")) +
						theme.fg("customMessageText", " to expand)"),
					0,
					0,
				),
			);
		}
	}
}
