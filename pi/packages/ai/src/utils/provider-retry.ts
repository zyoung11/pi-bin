const DEFAULT_MAX_RETRY_DELAY_MS = 60_000;

interface ProviderRetryOptions {
	maxRetries?: number;
	maxRetryDelayMs?: number;
	signal?: AbortSignal;
}

export class ProviderHttpError extends Error {
	status?: number;
	shouldRetry?: string;
	retryAfterMs?: string;
	retryAfter?: string;

	constructor(message: string) {
		super(message);
		this.name = "ProviderHttpError";
	}
}

/** Mirrors the pinned OpenAI/Anthropic SDK retry policy; review when either SDK is upgraded. */
function isRetryableProviderError(error: ProviderHttpError): boolean {
	const shouldRetry = error.shouldRetry;
	if (shouldRetry !== undefined) {
		if (shouldRetry === "true") return true;
		if (shouldRetry === "false") return false;
	}

	if (error.status === undefined) return true;
	return (
		error.status === 408 ||
		error.status === 409 ||
		error.status === 429 ||
		(typeof error.status === "number" && error.status >= 500)
	);
}

function validateServerRetryDelayMs(
	delayMs: number,
	maxRetryDelayMs: number | undefined,
	providerErrorMessage: string,
): number {
	const maxDelayMs = maxRetryDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS;
	if (maxDelayMs > 0 && delayMs > maxDelayMs) {
		throw new Error(
			`Server requested ${Math.ceil(delayMs / 1000)}s retry delay (max: ${Math.ceil(maxDelayMs / 1000)}s). ${providerErrorMessage}`,
		);
	}
	return delayMs;
}

function parseDecimalNumber(text: string): number | undefined {
	const trimmed = text.trim();
	let index = 0;
	let sign = 1;
	if (index < trimmed.length && (trimmed.charCodeAt(index) === 43 || trimmed.charCodeAt(index) === 45)) {
		if (trimmed.charCodeAt(index) === 45) sign = -1;
		index++;
	}
	let value = 0;
	let digits = 0;
	while (index < trimmed.length) {
		const code = trimmed.charCodeAt(index);
		if (code < 48 || code > 57) break;
		value = value * 10 + (code - 48);
		digits++;
		index++;
	}
	if (digits === 0) return undefined;
	if (index < trimmed.length && trimmed.charCodeAt(index) === 46) {
		index++;
		let scale = 0.1;
		let fractionDigits = 0;
		while (index < trimmed.length) {
			const code = trimmed.charCodeAt(index);
			if (code < 48 || code > 57) break;
			value += (code - 48) * scale;
			scale *= 0.1;
			fractionDigits++;
			index++;
		}
		if (fractionDigits === 0) return undefined;
	}
	if (index !== trimmed.length) return undefined;
	return sign * value;
}

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function daysFromCivil(year: number, month: number, day: number): number {
	const shiftedYear = month <= 2 ? year - 1 : year;
	const era = Math.floor(shiftedYear / 400);
	const yearOfEra = shiftedYear - era * 400;
	const monthIndex = month > 2 ? month - 3 : month + 9;
	const dayOfYear = Math.floor((153 * monthIndex + 2) / 5) + day - 1;
	const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
	return era * 146097 + dayOfEra - 719468;
}

function parseHttpDateGmt(text: string): number | undefined {
	const parts = text.split(" ");
	if (parts.length < 5) return undefined;
	const day = parseDecimalNumber(parts[1] ?? "");
	const year = parseDecimalNumber(parts[3] ?? "");
	if (day === undefined || year === undefined) return undefined;
	const monthText = parts[2] === undefined ? undefined : parts[2].toLowerCase();
	let month = 0;
	for (let i = 0; i < MONTH_NAMES.length; i++) {
		if (MONTH_NAMES[i] === monthText) {
			month = i + 1;
			break;
		}
	}
	if (month === 0) return undefined;
	const timeParts = (parts[4] ?? "").split(":");
	if (timeParts.length !== 3) return undefined;
	const hour = parseDecimalNumber(timeParts[0] ?? "");
	const minute = parseDecimalNumber(timeParts[1] ?? "");
	const second = parseDecimalNumber(timeParts[2] ?? "");
	if (hour === undefined || minute === undefined || second === undefined) return undefined;
	return daysFromCivil(year, month, day) * 86400000 + hour * 3600000 + minute * 60000 + second * 1000;
}

function getRetryDelayMs(error: ProviderHttpError, retryIndex: number, maxRetryDelayMs: number | undefined): number {
	const retryAfterMs = error.retryAfterMs;
	if (retryAfterMs !== undefined && retryAfterMs.length > 0) {
		const value = parseDecimalNumber(retryAfterMs);
		if (value !== undefined) return validateServerRetryDelayMs(value, maxRetryDelayMs, error.message);
	}

	const retryAfter = error.retryAfter;
	if (retryAfter !== undefined && retryAfter.length > 0) {
		const seconds = parseDecimalNumber(retryAfter);
		let delayMs: number | undefined;
		if (seconds !== undefined) {
			delayMs = seconds * 1000;
		} else {
			const requestTime = parseHttpDateGmt(retryAfter);
			if (requestTime !== undefined) {
				delayMs = requestTime - Date.now();
			}
		}
		if (delayMs !== undefined) {
			return validateServerRetryDelayMs(delayMs, maxRetryDelayMs, error.message);
		}
	}

	const exponentialDelay = Math.min(0.5 * 2 ** retryIndex, 8) * 1000;
	return exponentialDelay * (1 - Math.random() * 0.25);
}

function createAbortError(): Error {
	const error = new Error("Request aborted");
	error.name = "AbortError";
	return error;
}

function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal !== undefined && signal.aborted) {
			reject(createAbortError());
			return;
		}

		let settled = false;
		const timeout = setTimeout(
			() => {
				if (settled) return;
				settled = true;
				resolve();
			},
			Math.max(0, ms),
		);
		const onAbort = () => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			reject(createAbortError());
		};
		if (signal !== undefined) {
			signal.addEventListener("abort", onAbort, { once: true });
		}
	});
}

/**
 * Reproduce the retry behavior used by the OpenAI and Anthropic SDKs while making
 * their backoff sleep interruptible. Their built-in retry timers ignore the
 * request AbortSignal, so callers must invoke the SDK with `maxRetries: 0` and
 * wrap the request with this helper. Provider-requested delays above
 * `maxRetryDelayMs` fail immediately (60 seconds by default); set it to zero to
 * disable the limit.
 */
export async function retryProviderRequest<T>(
	request: () => Promise<T>,
	options: ProviderRetryOptions = {},
): Promise<T> {
	const maxRetries = options.maxRetries ?? 0;
	let retriesRemaining = maxRetries;

	for (;;) {
		try {
			return await request();
		} catch (caught) {
			if (options.signal !== undefined && options.signal.aborted) throw createAbortError();
			if (retriesRemaining <= 0 || !(caught instanceof ProviderHttpError)) throw caught;
			if (!isRetryableProviderError(caught)) throw caught;

			const retryIndex = maxRetries - retriesRemaining;
			retriesRemaining--;
			await abortableSleep(getRetryDelayMs(caught, retryIndex, options.maxRetryDelayMs), options.signal);
		}
	}
}
