/**
 * Minimal chat-completions HTTP transport that replaces the openai SDK:
 * a single POST plus SSE line decoding, producing the same stream shape and
 * the retry-layer-compatible error fields (status + Headers) pi relies on.
 */

import type { ChatCompletionChunk } from "openai/resources/chat/completions.js";
import type { ProviderHeaders } from "../types.ts";

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

function toHttpError(response: Response): Promise<Error> {
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
		const error = new Error(message) as Error & { status?: number };
		error.status = response.status;
		return error;
	});
}

export async function streamOpenAIChatCompletions(
	options: OpenAIHttpOptions,
	onChunk: (chunk: ChatCompletionChunk) => Promise<void>,
): Promise<void> {
	const fetchImpl = options.fetchImpl ?? globalThis.fetch;
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
		const response = await fetchImpl(options.url, {
			method: "POST",
			headers,
			body: JSON.stringify(options.body),
			signal: controller.signal,
		});
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

			while (true) {
				const readResult = await reader.read();
				buffer += readResult.done
					? decoder.decode()
					: decoder.decode(readResult.value, { stream: true });

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
		options.signal?.removeEventListener("abort", onUserAbort);
		throw error;
	}
}
