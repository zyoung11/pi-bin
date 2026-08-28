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

export interface OpenAIStreamResult {
	data: { next(): Promise<IteratorResult<ChatCompletionChunk>> };
	response: Response;
}

const MAX_ERROR_BODY_CHARS = 65_536;

function buildHeaders(apiKey: string | undefined, headers: ProviderHeaders | undefined): Record<string, string> {
	const out: Record<string, string> = { "Content-Type": "application/json" };
	if (apiKey) {
		out.Authorization = `Bearer ${apiKey}`;
	}
	if (headers) {
		for (const key of Object.keys(headers)) {
			out[key] = String(headers[key]);
		}
	}
	return out;
}

function isPlainNonEmptyObject(value: unknown): boolean {
	if (typeof value !== "object" || value === null) return false;
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) return false;
	return Object.keys(value).length > 0;
}

function errorMessage(status: number, rawText: string): { message: string; error?: unknown } {
	let parsed: unknown;
	try {
		parsed = JSON.parse(rawText);
	} catch {
		parsed = undefined;
	}
	const inner = isPlainNonEmptyObject(parsed) ? (parsed as Record<string, unknown>).error : undefined;
	let msg: string | undefined;
	if (isPlainNonEmptyObject(inner) && typeof (inner as Record<string, unknown>).message === "string") {
		msg = (inner as Record<string, unknown>).message as string;
	} else if (inner !== undefined) {
		try {
			msg = JSON.stringify(inner);
		} catch {
			msg = undefined;
		}
	} else if (parsed !== undefined) {
		try {
			msg = JSON.stringify(parsed);
		} catch {
			msg = undefined;
		}
	} else if (rawText.trim().length > 0) {
		msg = rawText.trim().slice(0, 2_000);
	}
	const message = status
		? msg !== undefined
			? `${status} ${msg}`
			: `${status} status code (no body)`
		: (msg ?? "(no status code or body)");
	return { message, error: isPlainNonEmptyObject(inner) ? inner : undefined };
}

async function toHttpError(response: Response): Promise<Error & { status: number; headers: Headers; error?: unknown }> {
	let rawText = "";
	try {
		rawText = (await response.text()).slice(0, MAX_ERROR_BODY_CHARS);
	} catch {
		rawText = "";
	}
	const { message, error } = errorMessage(response.status, rawText);
	const err = new Error(message) as Error & { status: number; headers: Headers; error?: unknown };
	err.status = response.status;
	err.headers = response.headers;
	if (error !== undefined) err.error = error;
	return err;
}

function sseJsonLines(response: Response): { next(): Promise<IteratorResult<ChatCompletionChunk>> } {
	const body = response.body;
	if (!body) throw new Error("Response has no body");
	const reader = body.getReader();
	const decoder = new TextDecoder("utf-8");
	let buffer = "";
	let dataLines: string[] = [];
	let finished = false;
	let pendingChunk: ChatCompletionChunk | undefined;
	let hasPending = false;

	const pump = async (): Promise<void> => {
		while (true) {
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
					if (payload === "[DONE]") {
						finished = true;
						return;
					}
					try {
						pendingChunk = JSON.parse(payload) as ChatCompletionChunk;
						hasPending = true;
						return;
					} catch {
						// skip malformed payloads
					}
				}
				newlineIndex = buffer.indexOf("\n");
			}

			if (finished) return;
			const readResult = await reader.read();
			if (readResult.done) {
				buffer += decoder.decode();
				finished = true;
				if (dataLines.length > 0) {
					const payload = dataLines.join("\n");
					dataLines = [];
					if (payload !== "[DONE]") {
						try {
							pendingChunk = JSON.parse(payload) as ChatCompletionChunk;
							hasPending = true;
						} catch {
							// skip malformed payloads
						}
					}
				}
				return;
			}
			buffer += decoder.decode(readResult.value, { stream: true });
		}
	};

	return {
		next: async (): Promise<IteratorResult<ChatCompletionChunk>> => {
			if (finished && !hasPending) {
				return { value: undefined as unknown as ChatCompletionChunk, done: true };
			}
			if (!hasPending) {
				await pump();
			}
			if (hasPending) {
				const chunk = pendingChunk as ChatCompletionChunk;
				pendingChunk = undefined;
				hasPending = false;
				return { value: chunk, done: false };
			}
			return { value: undefined as unknown as ChatCompletionChunk, done: true };
		},
	};
}

export async function streamOpenAIChatCompletions(options: OpenAIHttpOptions): Promise<OpenAIStreamResult> {
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
		return { data: sseJsonLines(response), response };
	} catch (error) {
		if (timedOut && options.timeoutMs !== undefined) {
			throw new Error(`Request timed out after ${options.timeoutMs}ms`);
		}
		throw error;
	} finally {
		if (timeoutId !== undefined) clearTimeout(timeoutId);
		options.signal?.removeEventListener("abort", onUserAbort);
	}
}
