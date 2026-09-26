import { Spacer } from "../../../../../tui/src/components/spacer.ts";
import { Text } from "../../../../../tui/src/components/text.ts";
import { getKeybindings } from "../../../../../tui/src/keybindings.ts";
import { Container, type TUI } from "../../../../../tui/src/tui.ts";
import { createAbortHandle } from "../../../../../tui/src/utils.ts";
import type { LlamaLoadProgress } from "../../../core/llama-router.ts";
import type { Theme } from "../theme/theme.ts";
import { DynamicBorder } from "./dynamic-border.ts";
import { keyHint } from "./keybinding-hints.ts";

const BAR_WIDTH = 40;

/** Progress line in the upstream llama.cpp UI shape: filled blocks, rules, percent. */
function barLine(ratio: number): string {
	const clamped = Math.max(0, Math.min(1, ratio));
	const filled = Math.round(clamped * BAR_WIDTH);
	return `${"█".repeat(filled)}${"─".repeat(BAR_WIDTH - filled)} ${Math.round(clamped * 100)}%`;
}

/**
 * Framed progress view for llama.cpp router operations: accent border, bold
 * title, the model id, a status line, the progress bar when the server reports
 * a ratio, the byte counts when it reports totals, and the cancel hint.
 */
export class LlamaProgressView extends Container {
	private readonly theme: Theme;
	private readonly tui: TUI;
	private readonly messageLine: Text;
	private readonly barLineText: Text;
	private readonly detailLine: Text;
	private readonly abortHandle = createAbortHandle();

	constructor(tui: TUI, theme: Theme, title: string, model: string, message: string) {
		super();
		this.theme = theme;
		this.tui = tui;
		this.messageLine = new Text(theme.fg("muted", message), 1, 0);
		this.barLineText = new Text("", 1, 0);
		this.detailLine = new Text("", 1, 0);
		this.addChild(new DynamicBorder((text: string) => theme.fg("accent", text)));
		this.addChild(new Text(theme.fg("accent", theme.bold(title)), 1, 0));
		this.addChild(new Text(theme.fg("text", model), 1, 0));
		this.addChild(new Spacer(1));
		this.addChild(this.messageLine);
		this.addChild(this.barLineText);
		this.addChild(this.detailLine);
		this.addChild(new Spacer(1));
		this.addChild(new Text(keyHint("tui.select.cancel", "stop"), 1, 0));
		this.addChild(new DynamicBorder((text: string) => theme.fg("accent", text)));
	}

	get signal(): AbortSignal {
		return this.abortHandle.signal;
	}

	setProgress(progress: LlamaLoadProgress): void {
		this.messageLine.setText(this.theme.fg("muted", progress.message));
		this.barLineText.setText(progress.ratio !== undefined ? this.theme.fg("accent", barLine(progress.ratio)) : "");
		this.detailLine.setText(progress.detail !== undefined ? this.theme.fg("dim", progress.detail) : "");
		this.tui.requestRender();
	}

	handleInput(data: string): void {
		if (this.abortHandle.signal.aborted) return;
		if (!getKeybindings().matches(data, "tui.select.cancel")) return;
		this.abortHandle.abort();
	}
}
