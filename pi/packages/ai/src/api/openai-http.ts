/**
 * Minimal chat-completions HTTP transport that replaces the openai SDK:
 * a single POST plus SSE line decoding, producing the same stream shape and
 * the retry-layer-compatible error fields (status + Headers) pi relies on.
 */

import { ProviderHttpError } from "../utils/provider-retry.ts";
import type { JsonValue, ProviderHeaders } from "../types.ts";

export type ChatCompletionChunkUsage = {
	prompt_tokens?: number;
	completion_tokens?: number;
	cached_tokens?: number;
	prompt_cache_hit_tokens?: number;
	prompt_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number };
	completion_tokens_details?: { reasoning_tokens?: number };
};

export type ChatCompletionChunkDelta = {
	content?: string | null;
	tool_calls?: JsonValue;
	reasoning_details?: JsonValue;
};

export type ChatCompletionChunkChoice = {
	finish_reason?: string;
	delta?: ChatCompletionChunkDelta;
	usage?: ChatCompletionChunkUsage;
};

export type ChatCompletionChunk = {
	id?: string;
	model?: string;
	usage?: ChatCompletionChunkUsage;
	choices?: ChatCompletionChunkChoice[];
};

export interface OpenAIHttpOptions {
	url: string;
	headers?: ProviderHeaders;
	body: unknown;
	apiKey?: string;
	fetchImpl?: typeof globalThis.fetch;
	signal?: AbortSignal;
	timeoutMs?: number;
}



function buildHeaders(apiKey: string | undefined, headers: ProviderHeaders | undefined): Record<string, string> {
	const out: Record<string, string> = { "Content-Type": "application/json" };
	if (apiKey) {
		out.Authorization = `Bearer ${apiKey}`;
	}
	if (headers) {
		for (const key of Object.keys(headers)) {
			const value = headers[key];
			if (value !== null && value !== undefined) out[key] = value;
		}
	}
	return out;
}

function toHttpError(response: Response): Promise<ProviderHttpError> {
	return response.text().then((bodyText) => {
		let parsed: unknown;
		try {
			parsed = JSON.parse(bodyText) as unknown;
		} catch {
			parsed = undefined;
		}
		let message: string;
		const errObj = parsed as { error?: { message?: string }; message?: string } | undefined;
		const errMessage = errObj?.error?.message;
		const topLevelMessage = errObj?.message;
		if (errMessage) {
			message = errMessage;
		} else if (topLevelMessage) {
			message = topLevelMessage;
		} else {
			message = bodyText.slice(0, 200) || `HTTP ${response.status}`;
		}
		const error = new ProviderHttpError(message);
		error.status = response.status;
		error.shouldRetry = response.headers.get("x-should-retry") ?? undefined;
		error.retryAfterMs = response.headers.get("retry-after-ms") ?? undefined;
		error.retryAfter = response.headers.get("retry-after") ?? undefined;
		return error;
	});
}

function incompleteUtf8TailLength(bytes: Uint8Array): number {
	for (let back = 1; back <= 3 && back <= bytes.length; back++) {
		const b = bytes[bytes.length - back];
		if (b === undefined) return 0;
		if (b >= 0xc0) {
			const expected = b >= 0xf0 ? 4 : b >= 0xe0 ? 3 : 2;
			return back < expected ? back : 0;
		}
		if ((b & 0xc0) !== 0x80) return 0;
	}
	return 0;
}

export async function streamOpenAIChatCompletions(
	options: OpenAIHttpOptions,
	onChunk: (chunk: ChatCompletionChunk) => Promise<void>,
): Promise<void> {
	const customFetch = options.fetchImpl;
	const headers = buildHeaders(options.apiKey, options.headers);
	const controller = new AbortController();
	let timedOut = false;
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const onUserAbort = (): void => {
		controller.abort();
	};

	if (options.signal) {
		if (options.signal.aborted) {
			throw new Error("Request aborted");
		}
		options.signal.addEventListener("abort", onUserAbort, { once: true });
	}
	if (options.timeoutMs !== undefined && options.timeoutMs > 0) {
		timeoutId = setTimeout(() => {
			timedOut = true;
			controller.abort();
		}, options.timeoutMs);
	}

	try {
		let response: Response;
		if (customFetch !== undefined) {
			response = await customFetch(options.url, {
				method: "POST",
				headers,
				body: JSON.stringify(options.body),
				signal: controller.signal,
			});
		} else {
			response = await fetch(options.url, {
				method: "POST",
				headers,
				body: JSON.stringify(options.body),
				signal: controller.signal,
			});
		}
		if (!response.ok) {
			throw await toHttpError(response);
		}

		const readAndProcessChunks = async (): Promise<void> => {
			const body = response.body;
			if (!body) throw new Error("Response has no body");
			const reader = body.getReader();
			const decoder = new TextDecoder("utf-8");
			let buffer = "";
			let dataLines: string[] = [];
			let pendingBytes: Uint8Array | undefined;

			while (true) {
				const readResult = await reader.read();
				if (readResult.done) {
					if (pendingBytes !== undefined && pendingBytes.length > 0) {
						buffer += decoder.decode(pendingBytes);
					}
					buffer += decoder.decode();
				} else {
					let chunk: Uint8Array = readResult.value;
					if (pendingBytes !== undefined && pendingBytes.length > 0) {
						const merged = new Uint8Array(pendingBytes.length + chunk.length);
						merged.set(pendingBytes, 0);
						merged.set(chunk, pendingBytes.length);
						chunk = merged;
					}
					const tailLength = incompleteUtf8TailLength(chunk);
					pendingBytes = tailLength > 0 ? chunk.slice(chunk.length - tailLength) : undefined;
					const safeBytes = tailLength > 0 ? chunk.slice(0, chunk.length - tailLength) : chunk;
					buffer += decoder.decode(safeBytes);
				}

				let newlineIndex = buffer.indexOf("\n");
				while (newlineIndex !== -1) {
					const rawLine = buffer.slice(0, newlineIndex);
					buffer = buffer.slice(newlineIndex + 1);
					const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
					if (line.length > 0 && line.startsWith("data:")) {
						let value = line.slice(5);
						if (value.startsWith(" ")) value = value.slice(1);
						dataLines.push(value);
					} else if (line.length === 0 && dataLines.length > 0) {
						const payload = dataLines.join("\n");
						dataLines = [];
						if (payload === "[DONE]") return;
						try {
							await onChunk(JSON.parse(payload) as ChatCompletionChunk);
						} catch {
							// skip malformed payloads
						}
					}
					newlineIndex = buffer.indexOf("\n");
				}

				if (readResult.done) break;
			}

			if (dataLines.length > 0) {
				const payload = dataLines.join("\n");
				if (payload !== "[DONE]") {
					try {
						await onChunk(JSON.parse(payload) as ChatCompletionChunk);
					} catch {
						// skip malformed payloads
					}
				}
			}
		};

		await readAndProcessChunks();
	} catch (error) {
		if (timeoutId !== undefined) clearTimeout(timeoutId);
		throw error;
	}
}
