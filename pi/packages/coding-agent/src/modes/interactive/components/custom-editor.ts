import { Editor, type EditorOptions, type EditorTheme } from "../../../../../tui/src/components/editor.ts";
import type { TUI } from "../../../../../tui/src/tui.ts";
import { visibleWidth } from "../../../../../tui/src/utils.ts";
import type { AppKeybinding, KeybindingsManager } from "../../../core/keybindings.ts";
import type { StatusIndicator } from "./status-indicator.ts";

export type CustomEditorOptions = EditorOptions & {
	/** Render working, compaction, summarization, retry and loading status in the editor's top border. */
	embedWorkingStatus?: boolean;
};

/**
 * Custom editor that handles app-level keybindings for coding-agent.
 */
export class CustomEditor extends Editor {
	private keybindings: KeybindingsManager;
	private workingStatusIndicator: StatusIndicator | undefined;
	/** Whether session status indicators embed into the top border. */
	readonly embedWorkingStatus: boolean;
	public actionHandlers: Record<string, () => void> = {};

	// Special handlers that can be dynamically replaced
	public onEscape?: () => void;
	public onCtrlD?: () => void;
	public onPasteImage?: () => void;
	/** Handler for extension-registered shortcuts. Returns true if handled. */
	public onExtensionShortcut?: (data: string) => boolean;

	constructor(tui: TUI, theme: EditorTheme, keybindings: KeybindingsManager, options?: CustomEditorOptions) {
		super(tui, theme, options);
		this.keybindings = keybindings;
		this.embedWorkingStatus = options?.embedWorkingStatus ?? false;
	}

	/**
	 * Set the session status indicator embedded into the top border.
	 * @param indicator The indicator to embed, or undefined to clear it
	 */
	setWorkingStatusIndicator(indicator: StatusIndicator | undefined): void {
		this.workingStatusIndicator = indicator;
	}

	/**
	 * Render the top border with the session status at its left edge and the
	 * scroll overflow label centered when both fit. Narrow widths degrade to the
	 * spinner glyph alone.
	 * @param width Total border width
	 * @param hiddenLineCount Lines hidden above the scroll offset
	 * @returns The styled border line
	 */
	protected override renderTopBorder(width: number, hiddenLineCount: number): string {
		const indicator = this.workingStatusIndicator;
		if (!this.embedWorkingStatus || indicator === undefined || width <= 0) {
			return super.renderTopBorder(width, hiddenLineCount);
		}

		let status = indicator.renderInBorder(Math.max(1, width - 5));
		let statusWidth = visibleWidth(status);
		if (statusWidth === 0) return super.renderTopBorder(width, hiddenLineCount);

		const overflowLabel = hiddenLineCount > 0 ? ` ↑ ${hiddenLineCount} more ` : undefined;
		const overflowLabelWidth = overflowLabel !== undefined ? visibleWidth(overflowLabel) : 0;
		const overflowStart = Math.floor((width - overflowLabelWidth) / 2);
		const canFitOverflow = (): boolean =>
			overflowLabel !== undefined && overflowLabelWidth + 2 <= width && overflowStart - (3 + statusWidth + 1) >= 1;

		if (overflowLabel !== undefined && !canFitOverflow()) {
			status = indicator.renderSpinnerInBorder(width);
			statusWidth = visibleWidth(status);
		}

		if (canFitOverflow()) {
			const leftBlockWidth = 3 + statusWidth + 1;
			return (
				this.borderColor("── ") +
				status +
				this.borderColor(
					` ${"─".repeat(overflowStart - leftBlockWidth)}${overflowLabel ?? ""}${"─".repeat(width - overflowStart - overflowLabelWidth)}`,
				)
			);
		}

		if (width >= statusWidth + 5) {
			return this.borderColor("── ") + status + this.borderColor(` ${"─".repeat(width - statusWidth - 4)}`);
		}

		status = indicator.renderSpinnerInBorder(width);
		statusWidth = visibleWidth(status);
		const prefixWidth = Math.min(3, Math.max(0, width - statusWidth));
		return (
			this.borderColor("─".repeat(prefixWidth)) +
			status +
			this.borderColor("─".repeat(Math.max(0, width - prefixWidth - statusWidth)))
		);
	}

	/**
	 * Register a handler for an app action.
	 */
	onAction(action: AppKeybinding, handler: () => void): void {
		this.actionHandlers[action] = handler;
	}

	/** Whether an action handler has been registered (missing-key reads trap on fn-valued records). */
	private hasAction(action: string): boolean {
		for (const key of Object.keys(this.actionHandlers)) {
			if (key === action) return true;
		}
		return false;
	}

	handleInput(data: string): void {
		// Check extension-registered shortcuts first
		if (this.onExtensionShortcut?.(data)) {
			return;
		}

		// Check for clipboard paste keybinding
		if (this.keybindings.matches(data, "app.clipboard.pasteImage")) {
			this.onPasteImage?.();
			return;
		}

		// Check app keybindings first

		// Escape/interrupt - only if autocomplete is NOT active
		if (this.keybindings.matches(data, "app.interrupt")) {
			if (!this.isShowingAutocomplete()) {
				// Use dynamic onEscape if set, otherwise registered handler
				const escapeHandler = this.onEscape;
				if (escapeHandler !== undefined) {
					escapeHandler();
					return;
				}
				if (this.hasAction("app.interrupt")) {
					const interruptHandler = this.actionHandlers["app.interrupt"];
					interruptHandler();
					return;
				}
			}
			// Let parent handle escape for autocomplete cancellation
			super.handleInput(data);
			return;
		}

		// Exit (Ctrl+D) - only when editor is empty
		if (this.keybindings.matches(data, "app.exit")) {
			if (this.getText().length === 0) {
				const ctrlDHandler = this.onCtrlD;
				if (ctrlDHandler !== undefined) {
					ctrlDHandler();
					return;
				}
				if (this.hasAction("app.exit")) {
					const exitHandler = this.actionHandlers["app.exit"];
					exitHandler();
					return;
				}
				// Fall through to editor handling for delete-char-forward when not empty
			}
		}

		// Explicit history bindings take precedence over app actions while the editor is focused.
		// This lets users bind Ctrl+P even though it cycles models by default.
		if (
			this.keybindings.matches(data, "tui.editor.historyPrevious") ||
			this.keybindings.matches(data, "tui.editor.historyNext")
		) {
			super.handleInput(data);
			return;
		}

		// Check all other app actions
		for (const action of Object.keys(this.actionHandlers)) {
			if (action === "app.interrupt" || action === "app.exit") continue;
			const handler = this.actionHandlers[action];
			if (handler !== undefined && this.keybindings.matches(data, action)) {
				handler();
				return;
			}
		}

		// Pass to parent for editor handling
		super.handleInput(data);
	}
}
