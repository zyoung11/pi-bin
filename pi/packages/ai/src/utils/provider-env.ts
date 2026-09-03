import type { ProviderEnv } from "../types.ts";

const procEnvCache: Map<string, string> = new Map();

/**
 * Fallback for https://github.com/oven-sh/bun/issues/27802.
 * Bun compiled binaries can expose an empty process.env inside Linux sandboxes
 * even though /proc/self/environ contains the environment.
 *
 * This intentionally duplicates restoreSandboxEnv() in
 * packages/coding-agent/src/bun/restore-sandbox-env.ts. The ai package can be
 * used directly, without going through that entrypoint, so provider env lookup
 * must not depend on process.env having been patched.
 */
function getBunSandboxEnvValue(_name: string): string | undefined {
	// Bun sandbox environment fallback is irrelevant in the static Node build.
	return undefined;
}

/**
 * Resolve a provider env value from scoped overrides, normal process.env, then
 * the duplicated Bun sandbox fallback for direct pi-ai consumers.
 */
export function getProviderEnvValue(name: string, env?: ProviderEnv): string | undefined {
	return env?.[name] || process.env[name] || getBunSandboxEnvValue(name) || undefined;
}
