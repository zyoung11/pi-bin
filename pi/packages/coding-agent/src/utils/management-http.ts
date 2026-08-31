type FetchInput = Parameters<typeof fetch>[0];

interface FetchRetryInit {
	[key: string]: unknown;
	signal?: AbortSignal;
	method?: string;
	headers?: Record<string, string>;
	body?: string;
}

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

export interface FetchRetryOptions {
	/** Number of additional attempts after the initial request. Defaults to two. */
	maxRetries?: number;
	/** Retry transient HTTP responses as well as transport failures. Defaults to true. */
	retryOnStatus?: boolean;
	/** Overall time budget shared by all attempts. */
	timeoutMs?: number;
	/** Per-attempt timeout. A new timeout is created for every attempt. */
	attemptTimeoutMs?: number;
}

/**
 * Fetch a management HTTP resource with a bounded immediate retry.
 *
 * This is intentionally a transport-level helper for idempotent management
 * requests (version checks, catalogs, and downloads). It must not be used for
 * agent/model operations: those can fail after the HTTP request starts and are
 * retried by their semantic caller instead.
 *
 * Caller cancellation and timeoutMs are terminal. attemptTimeoutMs aborts
 * only the current attempt so a hung connection can be retried.
 */
export async function fetchWithRetry(
	input: FetchInput,
	init: FetchRetryInit | undefined = undefined,
	options: FetchRetryOptions = {},
): Promise<Response> {
	const maxRetries =
		options.maxRetries === undefined || !Number.isFinite(options.maxRetries)
			? 2
			: Math.max(0, Math.floor(options.maxRetries));
	const retryOnStatus = options.retryOnStatus ?? true;
	const parentSignal = init?.signal ?? undefined;
	const timeoutSignal =
		options.timeoutMs !== undefined && options.timeoutMs > 0 ? AbortSignal.timeout(options.timeoutMs) : undefined;
	const attemptTimeoutMs =
		options.attemptTimeoutMs !== undefined && options.attemptTimeoutMs > 0 ? options.attemptTimeoutMs : undefined;

	for (let attempt = 0; ; attempt++) {
		if (parentSignal !== undefined) parentSignal.throwIfAborted();
		if (timeoutSignal !== undefined) timeoutSignal.throwIfAborted();
		const attemptTimeoutSignal = attemptTimeoutMs ? AbortSignal.timeout(attemptTimeoutMs) : undefined;
		const signals: AbortSignal[] = [];
		if (parentSignal !== undefined) signals.push(parentSignal);
		if (timeoutSignal !== undefined) signals.push(timeoutSignal);
		if (attemptTimeoutSignal !== undefined) signals.push(attemptTimeoutSignal);
		const signal = signals.length > 1 ? AbortSignal.any(signals) : signals[0];
		const baseInit: FetchRetryInit = init ?? {};

		try {
			const response = await fetch(input, { ...baseInit, signal });
			const shouldRetry = retryOnStatus && RETRYABLE_STATUS_CODES.has(response.status) && attempt < maxRetries;
			if (!shouldRetry) return response;
			try {
				const body = response.body;
				if (body !== null && body !== undefined) await body.cancel();
			} catch {
				// The response is being discarded before a retry. There is nothing useful to
				// do if cancelling its body also fails.
			}
		} catch (error) {
			const attemptTimedOut =
				attemptTimeoutSignal?.aborted === true && !parentSignal?.aborted && !timeoutSignal?.aborted;
			if (
				parentSignal?.aborted ||
				timeoutSignal?.aborted ||
				(error instanceof Error &&
					error.name === "AbortError" &&
					!attemptTimedOut &&
					timeoutSignal === undefined) ||
				attempt >= maxRetries
			) {
				throw error;
			}
		}
	}
}
