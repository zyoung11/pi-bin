import type { AuthCheck, AuthResult, Credential } from "../auth/types.ts";
import type { Api, Model } from "../types.ts";

function abortReason(signal: AbortSignal): unknown {
	if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] abortReason race-reject");
	if (signal.reason !== undefined) return signal.reason;
	const error = new Error("The operation was aborted");
	error.name = "AbortError";
	return error;
}

/** Create an operation-local signal for public APIs whose signal is optional. */
export function operationSignal(signal?: AbortSignal): AbortSignal {
	return signal ?? new AbortController().signal;
}

/** Race a void operation against an abort signal (concrete-type variant). */
export function raceVoidWithAbort(operation: Promise<void>, signal: AbortSignal): Promise<void> {
	if (signal.aborted) {
		if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceVoidWithAbort");
		return Promise.reject(abortReason(signal));
	}
	return Promise.race([
		operation,
		new Promise<void>((_resolve, reject) => {
			signal.addEventListener(
				"abort",
				() => {
					if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceVoidWithAbort");
					reject(abortReason(signal));
				},
				{ once: true },
			);
		}),
	]);
}
/** Race a boolean operation against an abort signal (concrete-type variant). */
export function raceBooleanWithAbort(operation: Promise<boolean>, signal: AbortSignal): Promise<boolean> {
	if (signal.aborted) {
		if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceBooleanWithAbort");
		return Promise.reject(abortReason(signal));
	}
	return Promise.race([
		operation,
		new Promise<boolean>((_resolve, reject) => {
			signal.addEventListener(
				"abort",
				() => {
					if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceBooleanWithAbort");
					reject(abortReason(signal));
				},
				{ once: true },
			);
		}),
	]);
}
/** Race a boolean-array operation against an abort signal (concrete-type variant). */
export function raceBooleanArrayWithAbort(operation: Promise<boolean[]>, signal: AbortSignal): Promise<boolean[]> {
	if (signal.aborted) {
		if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceBooleanArrayWithAbort");
		return Promise.reject(abortReason(signal));
	}
	return Promise.race([
		operation,
		new Promise<boolean[]>((_resolve, reject) => {
			signal.addEventListener(
				"abort",
				() => {
					if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceBooleanArrayWithAbort");
					reject(abortReason(signal));
				},
				{ once: true },
			);
		}),
	]);
}
/** Race an unknown operation against an abort signal (concrete-type variant). */
export function raceUnknownWithAbort(operation: Promise<unknown>, signal: AbortSignal): Promise<unknown> {
	if (signal.aborted) {
		if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceUnknownWithAbort");
		return Promise.reject(abortReason(signal));
	}
	return Promise.race([
		operation,
		new Promise<unknown>((_resolve, reject) => {
			signal.addEventListener(
				"abort",
				() => {
					if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceUnknownWithAbort");
					reject(abortReason(signal));
				},
				{ once: true },
			);
		}),
	]);
}
/** Race an auth-check operation against an abort signal (concrete-type variant). */
export function raceAuthCheckWithAbort(
	operation: Promise<AuthCheck | undefined>,
	signal: AbortSignal,
): Promise<AuthCheck | undefined> {
	if (signal.aborted) {
		if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceAuthCheckWithAbort");
		return Promise.reject(abortReason(signal));
	}
	return Promise.race([
		operation,
		new Promise<AuthCheck | undefined>((_resolve, reject) => {
			signal.addEventListener(
				"abort",
				() => {
					if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceAuthCheckWithAbort");
					reject(abortReason(signal));
				},
				{ once: true },
			);
		}),
	]);
}
/** Race a model-list operation against an abort signal (concrete-type variant). */
export function raceModelsWithAbort(
	operation: Promise<readonly Model<Api>[]>,
	signal: AbortSignal,
): Promise<readonly Model<Api>[]> {
	if (signal.aborted) {
		if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceModelsWithAbort");
		return Promise.reject(abortReason(signal));
	}
	return Promise.race([
		operation,
		new Promise<readonly Model<Api>[]>((_resolve, reject) => {
			signal.addEventListener(
				"abort",
				() => {
					if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceModelsWithAbort");
					reject(abortReason(signal));
				},
				{ once: true },
			);
		}),
	]);
}
/** Race a credential operation against an abort signal (concrete-type variant). */
export function raceCredentialWithAbort(operation: Promise<Credential>, signal: AbortSignal): Promise<Credential> {
	if (signal.aborted) {
		if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceCredentialWithAbort");
		return Promise.reject(abortReason(signal));
	}
	return Promise.race([
		operation,
		new Promise<Credential>((_resolve, reject) => {
			signal.addEventListener(
				"abort",
				() => {
					if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceCredentialWithAbort");
					reject(abortReason(signal));
				},
				{ once: true },
			);
		}),
	]);
}
/** Race an auth-result operation against an abort signal (concrete-type variant). */
export function raceAuthResultWithAbort(
	operation: Promise<AuthResult | undefined>,
	signal: AbortSignal,
): Promise<AuthResult | undefined> {
	if (signal.aborted) {
		if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceAuthResultWithAbort");
		return Promise.reject(abortReason(signal));
	}
	return Promise.race([
		operation,
		new Promise<AuthResult | undefined>((_resolve, reject) => {
			signal.addEventListener(
				"abort",
				() => {
					if (process.env.PI_DEBUG_URJ === "1") console.error("[abort-trace] race-reject: raceAuthResultWithAbort");
					reject(abortReason(signal));
				},
				{ once: true },
			);
		}),
	]);
}
