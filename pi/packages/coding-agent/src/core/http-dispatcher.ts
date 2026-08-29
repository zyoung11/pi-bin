/**
 * HTTP settings shared by the CLI, RPC entry and interactive mode. The undici dispatcher this
 * module used to install is gone in the statically compiled build: the native fetch stack owns
 * connection handling, so configureHttpDispatcher only validates the configured idle timeout and
 * proxy settings are exported to the environment for the native stack to honor.
 */

export const DEFAULT_HTTP_IDLE_TIMEOUT_MS = 300_000;

export const HTTP_IDLE_TIMEOUT_CHOICES = [
	{ label: "30 sec", timeoutMs: 30_000 },
	{ label: "1 min", timeoutMs: 60_000 },
	{ label: "2 min", timeoutMs: 120_000 },
	{ label: "5 min", timeoutMs: 300_000 },
	{ label: "disabled", timeoutMs: 0 },
] as const;

export function parseHttpIdleTimeoutMs(value: unknown): number | undefined {
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed.toLowerCase() === "disabled") {
			return 0;
		}
		if (trimmed.length === 0) {
			return undefined;
		}
		return parseHttpIdleTimeoutMs(Number(trimmed));
	}

	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		return undefined;
	}
	return Math.floor(value);
}

export function formatHttpIdleTimeoutMs(timeoutMs: number): string {
	let choice: { label: string; timeoutMs: number } | undefined;
	for (const item of HTTP_IDLE_TIMEOUT_CHOICES) {
		if (item.timeoutMs === timeoutMs) {
			choice = item;
			break;
		}
	}
	if (choice) {
		return choice.label;
	}
	return `${timeoutMs / 1000} sec`;
}

export function applyHttpProxySettings(httpProxy: string | undefined): void {
	const proxy = httpProxy?.trim();
	if (!proxy) return;
	if (process.env.HTTP_PROXY === undefined) process.env.HTTP_PROXY = proxy;
	if (process.env.HTTPS_PROXY === undefined) process.env.HTTPS_PROXY = proxy;
}

export function configureHttpDispatcher(timeoutMs: number = DEFAULT_HTTP_IDLE_TIMEOUT_MS): void {
	const normalizedTimeoutMs = parseHttpIdleTimeoutMs(timeoutMs);
	if (normalizedTimeoutMs === undefined) {
		throw new Error(`Invalid HTTP idle timeout: ${String(timeoutMs)}`);
	}
}
