import { existsSync } from "node:fs";
import { homedir } from "node:os";
import type { AuthContext } from "./types.ts";

function getProcessEnv(): Record<string, string | undefined> {
	return process.env;
}

/**
 * Default auth context: env vars from `process.env`, file existence via
 * `node:fs` `existsSync` (static Node build; no browser fallback).
 */
export function defaultProviderAuthContext(): AuthContext {
	return {
		async env(name: string): Promise<string | undefined> {
			const value = getProcessEnv()[name];
			return typeof value === "string" && value.trim().length > 0 ? value : undefined;
		},

		async fileExists(path: string): Promise<boolean> {
			let resolved = path;
			if (resolved.startsWith("~")) {
				resolved = homedir() + resolved.slice(1);
			}
			return existsSync(resolved);
		},
	};
}
