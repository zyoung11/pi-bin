import { CancellableLoader } from "../../../../../tui/src/components/cancellable-loader.ts";
import { Loader } from "../../../../../tui/src/components/loader.ts";
import { Spacer } from "../../../../../tui/src/components/spacer.ts";
import { Text } from "../../../../../tui/src/components/text.ts";
import { Container, type TUI } from "../../../../../tui/src/tui.ts";
import type { Theme } from "../theme/theme.ts";
import { DynamicBorder } from "./dynamic-border.ts";
import { keyHint } from "./keybinding-hints.ts";

/** Loader wrapped with borders for extension UI */
export class BorderedLoader extends Container {
	private loader: Loader;
	private cancellableLoader: CancellableLoader | undefined;
	private cancellable: boolean;
	private signalController?: { signal: AbortSignal; abort: () => void };

	constructor(tui: TUI, theme: Theme, message: string, options?: { cancellable?: boolean }) {
		super();
		this.cancellable = options?.cancellable ?? true;
		const borderColor = (s: string) => theme.fg("border", s);
		this.addChild(new DynamicBorder(borderColor));
		if (this.cancellable) {
			this.cancellableLoader = new CancellableLoader(
				tui,
				(s) => theme.fg("accent", s),
				(s) => theme.fg("muted", s),
				message,
			);
			this.loader = this.cancellableLoader;
		} else {
			const controller = new AbortController();
			this.signalController = { signal: controller.signal, abort: () => controller.abort() };
			this.loader = new Loader(
				tui,
				(s) => theme.fg("accent", s),
				(s) => theme.fg("muted", s),
				message,
			);
		}
		this.addChild(this.loader);
		if (this.cancellable) {
			this.addChild(new Spacer(1));
			this.addChild(new Text(keyHint("tui.select.cancel", "cancel"), 1, 0));
		}
		this.addChild(new Spacer(1));
		this.addChild(new DynamicBorder(borderColor));
	}

	get signal(): AbortSignal {
		if (this.cancellableLoader !== undefined) {
			return this.cancellableLoader.signal;
		}
		return this.signalController?.signal ?? new AbortController().signal;
	}

	set onAbort(fn: (() => void) | undefined) {
		if (this.cancellableLoader !== undefined) {
			this.cancellableLoader.onAbort = fn;
		}
	}

	handleInput(data: string): void {
		if (this.cancellableLoader !== undefined) {
			this.cancellableLoader.handleInput(data);
		}
	}

	dispose(): void {
		if (this.cancellableLoader !== undefined) {
			this.cancellableLoader.dispose();
		} else {
			this.loader.stop();
		}
	}
}
