/** llama.cpp router management for the /llama command. */

import { sleep } from "../utils/sleep.ts";

/** One configured server the command can manage. */
export interface LlamaRouterServer {
	id: string;
	name: string;
	baseUrl: string;
	apiKey: string | undefined;
}

/** One model as reported by the router catalog. */
export interface LlamaRouterModel {
	id: string;
	status: string;
	failed: boolean;
	detail: string;
}

/** Outcome of a router operation that reports failure instead of throwing. */
export interface LlamaRouterResult {
	ok: boolean;
	cancelled: boolean;
	error: string | undefined;
}

/** Model states that hold memory and can be unloaded. */
export function llamaModelIsResident(model: LlamaRouterModel): boolean {
	return model.status === "loaded" || model.status === "sleeping";
}

const LOAD_POLL_INTERVAL_MS = 500;
const UNLOAD_POLL_INTERVAL_MS = 250;
const LOAD_TIMEOUT_MS = 10 * 60_000;
const UNLOAD_TIMEOUT_MS = 60_000;
const CANCEL_TIMEOUT_MS = 15_000;

function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

function lookupString(value: unknown, key: string): string | undefined {
	if (value === null || typeof value !== "object") return undefined;
	const found = recordViewOf(value)[key];
	return typeof found === "string" ? found : undefined;
}

function lookupNumber(value: unknown, key: string): number | undefined {
	if (value === null || typeof value !== "object") return undefined;
	const found = recordViewOf(value)[key];
	return typeof found === "number" ? found : undefined;
}

function lookupBoolean(value: unknown, key: string): boolean | undefined {
	if (value === null || typeof value !== "object") return undefined;
	const found = recordViewOf(value)[key];
	return typeof found === "boolean" ? found : undefined;
}

function lookupRecord(value: unknown, key: string): Record<string, unknown> | undefined {
	if (value === null || typeof value !== "object") return undefined;
	const found = recordViewOf(value)[key];
	if (found === null || typeof found !== "object") return undefined;
	return recordViewOf(found);
}

function lookupArray(value: unknown, key: string): unknown[] | undefined {
	if (value === null || typeof value !== "object") return undefined;
	const found = recordViewOf(value)[key];
	return Array.isArray(found) ? found : undefined;
}

/**
 * Router root for a provider base URL. The OpenAI-compatible API carries a /v1
 * suffix while the router management endpoints and /props sit at the root.
 */
export function llamaRouterRoot(baseUrl: string): string {
	let root = baseUrl.trim();
	while (root.endsWith("/")) root = root.slice(0, root.length - 1);
	if (root.endsWith("/v1")) root = root.slice(0, root.length - 3);
	return root;
}

function errorText(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}

function serverErrorText(status: number, body: string): string {
	const parsed: unknown = body.length > 0 ? safeParse(body) : undefined;
	const errorRecord = lookupRecord(parsed, "error");
	const message = lookupString(errorRecord, "message") ?? lookupString(parsed, "message");
	if (message !== undefined && message.length > 0) return message;
	return `HTTP ${status}`;
}

function safeParse(text: string): unknown {
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return undefined;
	}
}

function requestHeaders(server: LlamaRouterServer, hasBody: boolean): Record<string, string> {
	const headers: Record<string, string> = {};
	if (server.apiKey !== undefined && server.apiKey.length > 0) headers["Authorization"] = `Bearer ${server.apiKey}`;
	if (hasBody) headers["Content-Type"] = "application/json";
	return headers;
}

async function requestJson(
	server: LlamaRouterServer,
	path: string,
	method: string,
	body: string | undefined,
	signal: AbortSignal,
): Promise<unknown> {
	const url = `${llamaRouterRoot(server.baseUrl)}${path}`;
	const response = await fetch(url, {
		method,
		headers: requestHeaders(server, body !== undefined),
		body,
		signal,
	});
	const text = await response.text();
	if (!response.ok) throw new Error(serverErrorText(response.status, text));
	if (text.length === 0) return undefined;
	return JSON.parse(text) as unknown;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units: string[] = ["KiB", "MiB", "GiB", "TiB"];
	let value = bytes / 1024;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value = value / 1024;
		unitIndex++;
	}
	const rounded = value >= 10 ? Math.round(value * 10) / 10 : Math.round(value * 100) / 100;
	return `${rounded} ${units[unitIndex]}`;
}

function statusLabel(status: string): string {
	if (status === "loaded") return "loaded";
	if (status === "loading") return "loading";
	if (status === "sleeping") return "sleeping";
	if (status === "downloading") return "downloading";
	if (status === "unloaded") return "unloaded";
	return status;
}

function progressLabel(statusRecord: Record<string, unknown> | undefined): string | undefined {
	const progress = lookupRecord(statusRecord, "progress");
	if (progress === undefined) return undefined;
	const keys = Object.keys(progress);
	if (keys.length === 0) return undefined;
	let done = 0;
	let total = 0;
	for (const key of keys) {
		const entry = lookupRecord(progress, key);
		const entryDone = lookupNumber(entry, "done");
		const entryTotal = lookupNumber(entry, "total");
		if (entryDone !== undefined && entryDone > 0) done += entryDone;
		if (entryTotal !== undefined && entryTotal > 0) total += entryTotal;
	}
	if (total <= 0) return undefined;
	return `${Math.floor((done / total) * 100)}%`;
}

function describeModel(
	entry: Record<string, unknown>,
	statusRecord: Record<string, unknown> | undefined,
	status: string,
	failed: boolean,
): string {
	const parts: string[] = [];
	parts.push(failed ? "failed to load" : statusLabel(status));
	const meta = lookupRecord(entry, "meta");
	const ftype = lookupString(meta, "ftype");
	if (ftype !== undefined && ftype.length > 0) parts.push(ftype);
	const size = lookupNumber(meta, "size");
	if (size !== undefined && size > 0) parts.push(formatBytes(size));
	const context = lookupNumber(meta, "n_ctx") ?? lookupNumber(meta, "n_ctx_train");
	if (context !== undefined && context > 0) parts.push(`${Math.round(context / 1024)}k ctx`);
	const modalities = lookupArray(lookupRecord(entry, "architecture"), "input_modalities");
	if (modalities !== undefined) {
		for (const modality of modalities) {
			if (modality === "image") parts.push("vision");
		}
	}
	const progress = progressLabel(statusRecord);
	if (progress !== undefined) parts.push(progress);
	return parts.join(" · ");
}

function parseModelEntry(entry: Record<string, unknown>): LlamaRouterModel | undefined {
	const id = lookupString(entry, "id");
	if (id === undefined || id.length === 0) return undefined;
	const statusRecord = lookupRecord(entry, "status");
	const status = lookupString(statusRecord, "value") ?? "unknown";
	const failed = lookupBoolean(statusRecord, "failed") === true;
	return { id, status, failed, detail: describeModel(entry, statusRecord, status, failed) };
}

function modelEntriesOf(payload: unknown): Record<string, unknown>[] {
	const raw = Array.isArray(payload) ? payload : lookupArray(payload, "data");
	if (raw === undefined) return [];
	const entries: Record<string, unknown>[] = [];
	for (const item of raw) {
		if (item === null || typeof item !== "object") continue;
		entries.push(recordViewOf(item));
	}
	return entries;
}

function statusRank(status: string): number {
	if (status === "loaded" || status === "sleeping") return 0;
	if (status === "loading" || status === "downloading") return 1;
	return 2;
}

function compareModels(left: LlamaRouterModel, right: LlamaRouterModel): number {
	const rank = statusRank(left.status) - statusRank(right.status);
	if (rank !== 0) return rank;
	return left.id.localeCompare(right.id);
}

export function findLlamaModel(models: readonly LlamaRouterModel[], modelId: string): LlamaRouterModel | undefined {
	for (const model of models) {
		if (model.id === modelId) return model;
	}
	return undefined;
}

/** Whether the server speaks llama.cpp router protocol, which exposes model status in its catalog. */
export async function probeLlamaRouter(server: LlamaRouterServer, signal: AbortSignal): Promise<boolean> {
	try {
		const models = await listLlamaModels(server, signal);
		for (const model of models) {
			if (model.status !== "unknown") return true;
		}
		return false;
	} catch {
		return false;
	}
}

export async function listLlamaModels(server: LlamaRouterServer, signal: AbortSignal): Promise<LlamaRouterModel[]> {
	const payload = await requestJson(server, "/models", "GET", undefined, signal);
	const models: LlamaRouterModel[] = [];
	for (const entry of modelEntriesOf(payload)) {
		const model = parseModelEntry(entry);
		if (model !== undefined) models.push(model);
	}
	models.sort(compareModels);
	return models;
}

function resultFromError(error: unknown, signal: AbortSignal): LlamaRouterResult {
	if (signal.aborted) return { ok: false, cancelled: true, error: undefined };
	return { ok: false, cancelled: false, error: errorText(error) };
}

/**
 * Ask the router to load one model and wait until it reports loaded. Progress
 * messages carry the current model detail so the caller can render them.
 */
export async function loadLlamaModel(
	server: LlamaRouterServer,
	modelId: string,
	onProgress: (message: string) => void,
	signal: AbortSignal,
): Promise<LlamaRouterResult> {
	const deadline = Date.now() + LOAD_TIMEOUT_MS;
	try {
		await requestJson(server, "/models/load", "POST", JSON.stringify({ model: modelId }), signal);
	} catch (error) {
		return resultFromError(error, signal);
	}
	onProgress(`Loading ${modelId}`);
	while (Date.now() < deadline) {
		try {
			await sleep(LOAD_POLL_INTERVAL_MS, signal);
			const model = findLlamaModel(await listLlamaModels(server, signal), modelId);
			if (model === undefined) return { ok: true, cancelled: false, error: undefined };
			if (model.status === "loaded") return { ok: true, cancelled: false, error: undefined };
			if (model.failed || model.status === "unloaded") {
				return { ok: false, cancelled: false, error: `Model ${modelId} failed to load` };
			}
			onProgress(`Loading ${modelId} · ${model.detail}`);
		} catch (error) {
			return resultFromError(error, signal);
		}
	}
	return { ok: false, cancelled: false, error: `Timed out waiting for ${modelId} to load` };
}

export async function unloadLlamaModel(
	server: LlamaRouterServer,
	modelId: string,
	signal: AbortSignal,
): Promise<LlamaRouterResult> {
	const deadline = Date.now() + UNLOAD_TIMEOUT_MS;
	try {
		await requestJson(server, "/models/unload", "POST", JSON.stringify({ model: modelId }), signal);
	} catch (error) {
		return resultFromError(error, signal);
	}
	while (Date.now() < deadline) {
		try {
			await sleep(UNLOAD_POLL_INTERVAL_MS, signal);
			const model = findLlamaModel(await listLlamaModels(server, signal), modelId);
			if (model === undefined) return { ok: true, cancelled: false, error: undefined };
			if (model.status === "unloaded") return { ok: true, cancelled: false, error: undefined };
		} catch (error) {
			return resultFromError(error, signal);
		}
	}
	return { ok: false, cancelled: false, error: `Timed out waiting for ${modelId} to unload` };
}

/**
 * Stop an in-flight load after the user cancels and wait until the router
 * reports the model as unloaded, so the next catalog read is not stale.
 */
export async function cancelLlamaModelLoad(server: LlamaRouterServer, modelId: string): Promise<void> {
	await unloadLlamaModel(server, modelId, AbortSignal.timeout(CANCEL_TIMEOUT_MS));
}
