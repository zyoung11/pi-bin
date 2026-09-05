import { bumpMarkdownRenderEpoch } from "../../../../../tui/src/components/markdown.ts";
import type { TUI } from "../../../../../tui/src/tui.ts";
import type { SettingsManager } from "../../../core/settings-manager.ts";
import { initTheme, setTheme, setThemeInstance, type Theme } from "./theme.ts";

type ThemeResult = { success: boolean; error?: string };

export class InteractiveThemeController {
	private readonly ui: TUI;
	private readonly getSettingsManager: () => SettingsManager;
	private readonly showError: (message: string) => void;
	private readonly onChanged: () => void;
	private currentThemeSetting: string | undefined;
	private activeThemeName: string | undefined;

	constructor(
		ui: TUI,
		options: {
			getSettingsManager: () => SettingsManager;
			showError: (message: string) => void;
			onChanged: () => void;
			initialThemeSetting?: string;
		},
	) {
		this.ui = ui;
		this.getSettingsManager = options.getSettingsManager;
		this.showError = options.showError;
		this.onChanged = options.onChanged;
		this.currentThemeSetting = options.initialThemeSetting;
		this.activeThemeName = this.currentThemeSetting ?? this.getSettingsManager().getThemeSetting() ?? "dark";
		initTheme(this.activeThemeName, true);
	}

	rebindTui(): void {}

	async applyFromSettings(): Promise<void> {
		const settingsManager = this.getSettingsManager();
		const themeSetting = this.currentThemeSetting ?? settingsManager.getThemeSetting();
		this.applyThemeName(themeSetting ?? "dark", true);
	}

	getThemeSelection(): string | undefined {
		return this.currentThemeSetting ?? this.getSettingsManager().getThemeSetting() ?? this.activeThemeName;
	}

	setThemeName(themeName: string, showError = false): ThemeResult {
		const result = this.applyThemeName(themeName, showError);
		if (result.success) {
			this.currentThemeSetting = themeName;
		}
		return result;
	}

	async setThemeSetting(themeSetting: string): Promise<void> {
		this.currentThemeSetting = themeSetting;
		await this.applyFromSettings();
	}

	setThemeInstance(themeInstance: Theme): ThemeResult {
		setThemeInstance(themeInstance);
		this.activeThemeName = "<in-memory>";
		this.notifyChanged();
		return { success: true };
	}

	preview(themeName: string): void {
		if (setTheme(themeName, true).success) {
			bumpMarkdownRenderEpoch();
			this.ui.invalidate();
			this.ui.requestRender();
		}
	}

	private applyThemeName(themeName: string, showError = false): ThemeResult {
		const result = setTheme(themeName, true);
		this.activeThemeName = result.success ? themeName : "dark";
		this.notifyChanged();
		if (!result.success && showError) {
			this.showError(`Failed to load theme "${themeName}": ${result.error}\nFell back to dark theme.`);
		}
		return result;
	}

	private notifyChanged(): void {
		bumpMarkdownRenderEpoch();
		this.ui.invalidate();
		this.onChanged();
	}
}
