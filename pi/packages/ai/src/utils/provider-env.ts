import type { ProviderEnv } from "../types.ts";

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

function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

/**
 * Resolve a provider env value from scoped overrides, normal process.env, then
 * the duplicated Bun sandbox fallback for direct pi-ai consumers. The scoped
 * record is read through a dynamic view: an absent key on a typed string record
 * traps under the static runtime where Node returns undefined.
 */
export function getProviderEnvValue(name: string, env?: ProviderEnv): string | undefined {
	if (env !== undefined && env !== null) {
		const override = recordViewOf(env)[name];
		if (typeof override === "string" && override.length > 0) return override;
	}
	const ambient = process.env[name];
	if (ambient !== undefined && ambient.length > 0) return ambient;
	return getBunSandboxEnvValue(name) ?? undefined;
}
