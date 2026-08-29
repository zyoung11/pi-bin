class ProviderHttpError extends Error {
	status?: number;
	shouldRetry?: string;
	retryAfterMs?: string;
	retryAfter?: string;

	constructor(message: string) {
		super(message);
		this.name = "ProviderHttpError";
	}
}

function probeExtract(response: Response): ProviderHttpError {
	const error = new ProviderHttpError("boom");
	error.status = response.status;
	error.shouldRetry = response.headers.get("x-should-retry") ?? undefined;
	error.retryAfterMs = response.headers.get("retry-after-ms") ?? undefined;
	error.retryAfter = response.headers.get("retry-after") ?? undefined;
	return error;
}

function probeRetryable(error: ProviderHttpError): boolean {
	const shouldRetry = error.shouldRetry;
	if (shouldRetry !== undefined) {
		if (shouldRetry === "true") return true;
		if (shouldRetry === "false") return false;
	}
	if (error.status === undefined) return true;
	return error.status === 429 || error.status >= 500;
}

function probeDelay(error: ProviderHttpError): number {
	const retryAfterMs = error.retryAfterMs;
	if (retryAfterMs !== undefined && retryAfterMs.length > 0) {
		const parsed = Number(retryAfterMs);
		if (!Number.isNaN(parsed)) return parsed;
	}
	if (error.retryAfter !== undefined && error.retryAfter.length > 0) {
		return 1000;
	}
	return 500;
}

function probeCatch(action: () => Promise<void>): Promise<string> {
	return action()
		.then(() => "ok")
		.catch((caught) => {
			if (caught instanceof ProviderHttpError) {
				if (!probeRetryable(caught)) throw caught;
				return `retry:${probeDelay(caught)}:${caught.message}`;
			}
			throw caught;
		});
}

export async function main(response: Response): Promise<string> {
	const error = probeExtract(response);
	const out = probeRetryable(error) ? "retryable" : "fatal";
	return `${out}:${await probeCatch(() => Promise.reject(error))}`;
}
