import { access } from "node:fs/promises";
import { homedir } from "node:os";
import type { AuthContext } from "./types.ts";

function getProcessEnv(): Record<string, string | undefined> | undefined {
	const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
	return proc?.env;
}

/**
 * Default auth context: env vars from `process.env` (undefined in browsers),
 * file existence via node:fs (always false in browsers).
 */
export function defaultProviderAuthContext(): AuthContext {
	return {
		async env(name: string): Promise<string | undefined> {
			const value = getProcessEnv()?.[name];
			return typeof value === "string" && value.trim().length > 0 ? value : undefined;
		},

		async fileExists(path: string): Promise<boolean> {
			try {
				let resolved = path;
				if (resolved.startsWith("~")) {
					resolved = homedir() + resolved.slice(1);
				}
				await access(resolved);
				return true;
			} catch {
				return false;
			}
		},
	};
}
