function abortReason(signal: AbortSignal): unknown {
	if (signal.reason !== undefined) return signal.reason;
	const error = new Error("The operation was aborted");
	error.name = "AbortError";
	return error;
}

/** Create an operation-local signal for public APIs whose signal is optional. */
export function operationSignal(signal?: AbortSignal): AbortSignal {
	return signal ?? new AbortController().signal;
}

/**
 * Stop waiting for an operation when its signal aborts while continuing to
 * observe the abandoned promise so a later rejection is always handled.
 */
export function raceWithAbortSignal(operation: Promise<unknown>, signal: AbortSignal): Promise<unknown> {
	if (signal.aborted) {
		void operation.catch(() => {});
		return Promise.reject(abortReason(signal));
	}

	return new Promise<unknown>((resolve, reject) => {
		let settled = false;
		const cleanup = () => signal.removeEventListener("abort", onAbort);
		const onAbort = () => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(abortReason(signal));
		};

		signal.addEventListener("abort", onAbort, { once: true });
		void operation
			.then((value) => {
				if (settled) return;
				settled = true;
				cleanup();
				resolve(value);
			})
			.catch((error: unknown) => {
				if (settled) return;
				settled = true;
				cleanup();
				reject(error);
			});
		if (signal.aborted) onAbort();
	});
}
