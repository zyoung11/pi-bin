import chalk from "../utils/mini-chalk.ts";
import type { AppMode, ProjectTrustContext } from "../core/project-trust.ts";
import type { SettingsManager } from "../core/settings-manager.ts";
import { showStartupInput, showStartupSelector } from "./startup-ui.ts";

export function createProjectTrustContext(options: {
	cwd: string;
	mode: AppMode;
	settingsManager: SettingsManager;
	hasUI: boolean;
}): ProjectTrustContext {
	return {
		cwd: options.cwd,
		hasUI: options.hasUI,
		ui: {
			select: async (title, selectOptions) => {
				if (!options.hasUI) {
					return undefined;
				}
				if (options.mode !== "interactive") {
					return undefined;
				}
				return showStartupSelector(
					options.settingsManager,
					title,
					selectOptions.map((option) => ({ label: option, value: option })),
				) as Promise<string | undefined>;
			},
			confirm: async (title, message) => {
				if (!options.hasUI) {
					return false;
				}
				if (options.mode !== "interactive") {
					return false;
				}
				return (
					((await showStartupSelector(options.settingsManager, `${title}\n${message}`, [
						{ label: "Yes", value: true },
						{ label: "No", value: false },
					])) as boolean | undefined) ?? false
				);
			},
			input: async (title, placeholder) => {
				if (!options.hasUI) {
					return undefined;
				}
				if (options.mode !== "interactive") {
					return undefined;
				}
				return showStartupInput(options.settingsManager, title, placeholder);
			},
			notify: (message, type = "info") => {
				if (options.mode !== "interactive") {
					const color = type === "error" ? chalk.red : type === "warning" ? chalk.yellow : chalk.cyan;
					console.error(color(message));
				}
			},
		},
	};
}
