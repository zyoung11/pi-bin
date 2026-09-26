/** llama.cpp router management for the /llama command. */

import { incompleteUtf8TailLength } from "../../../ai/src/api/openai-http.ts";
import { sleep } from "../utils/sleep.ts";

/** One configured server the command can manage. */
export interface LlamaRouterServer {
	id: string;
	name: string;
	baseUrl: string;
	apiKey: string | undefined;
}

/** One progress update for the llama.cpp progress view. */
export interface LlamaLoadProgress {
	message: string;
	ratio: number | undefined;
	detail: string | undefined;
}

/** One model event carried by the router status stream. */
export interface LlamaRouterEvent {
	model: string;
	event: string;
	data: Record<string, unknown> | undefined;
}

/** One model as reported by the router catalog. */
export interface LlamaRouterModel {
	id: string;
	status: string;
	failed: boolean;
	detail: string;
	ratio: number | undefined;
	bytes: string | undefined;
	context: number | undefined;
	contextTrain: number | undefined;
	ftype: string | undefined;
	size: number | undefined;
	image: boolean;
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

const LOAD_POLL_INTERVAL_MS = 250;
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

/** Byte counters summed over every file the status record reports progress for. */
function progressTotals(progress: Record<string, unknown>): { done: number; total: number } | undefined {
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
	return { done, total };
}

function progressLabel(statusRecord: Record<string, unknown> | undefined): string | undefined {
	const progress = lookupRecord(statusRecord, "progress");
	if (progress === undefined) return undefined;
	const totals = progressTotals(progress);
	if (totals === undefined) return undefined;
	const ratio = Math.min(1, totals.done / totals.total);
	const filled = Math.floor(ratio * 10);
	let bar = "";
	for (let i = 0; i < 10; i++) bar += i < filled ? "█" : "░";
	return `${bar} ${Math.floor(ratio * 100)}% · ${formatBytes(totals.done)} / ${formatBytes(totals.total)}`;
}

/**
 * Catalog metadata as the server reports it: a meta record on upstream
 * llama.cpp, or the launcher args and preset on llama-server wrappers where
 * the context is the --ctx-size argument and the quantization is the model
 * file's suffix.
 */
function catalogMetadataOf(
	entry: Record<string, unknown>,
	statusRecord: Record<string, unknown> | undefined,
): {
	context: number | undefined;
	contextTrain: number | undefined;
	ftype: string | undefined;
	size: number | undefined;
} {
	const meta = lookupRecord(entry, "meta");
	const args = lookupArray(statusRecord, "args");
	let argsCtx: number | undefined;
	let argsModel: string | undefined;
	if (args !== undefined) {
		for (let i = 0; i < args.length; i++) {
			const flag = args[i];
			const value = i + 1 < args.length ? args[i + 1] : undefined;
			if (flag === "--ctx-size" && typeof value === "string") {
				const parsed = Number(value);
				if (Number.isFinite(parsed) && parsed > 0) argsCtx = parsed;
			}
			if (flag === "--model" && typeof value === "string") argsModel = value;
		}
	}
	const preset = lookupString(statusRecord, "preset");
	let presetCtx: number | undefined;
	let presetModel = argsModel;
	if (preset !== undefined) {
		const ctxMatch = /(?:^|\n)\s*ctx-size\s*=\s*(\d+)/.exec(preset);
		if (ctxMatch !== null) {
			const parsed = Number(ctxMatch[1]);
			if (Number.isFinite(parsed) && parsed > 0) presetCtx = parsed;
		}
		const modelMatch = /(?:^|\n)\s*model\s*=\s*([^\n]+)/.exec(preset);
		if (modelMatch !== null && presetModel === undefined) presetModel = modelMatch[1].trim();
	}
	const modelPath = presetModel ?? "";
	const slash = Math.max(modelPath.lastIndexOf("/"), modelPath.lastIndexOf("\\"));
	const fileName = slash >= 0 ? modelPath.slice(slash + 1) : modelPath;
	const dot = fileName.lastIndexOf(".");
	const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
	const dash = stem.lastIndexOf("-");
	const suffixQuant = dash >= 0 ? stem.slice(dash + 1) : undefined;
	return {
		context: lookupNumber(meta, "n_ctx") ?? argsCtx ?? presetCtx,
		contextTrain: lookupNumber(meta, "n_ctx_train"),
		ftype: lookupString(meta, "ftype") ?? suffixQuant,
		size: lookupNumber(meta, "size"),
	};
}

function describeModel(
	entry: Record<string, unknown>,
	statusRecord: Record<string, unknown> | undefined,
	status: string,
	failed: boolean,
): string {
	const parts: string[] = [];
	parts.push(failed ? "failed to load" : statusLabel(status));
	const metadata = catalogMetadataOf(entry, statusRecord);
	const ftype = metadata.ftype;
	if (ftype !== undefined && ftype.length > 0) parts.push(ftype);
	const size = metadata.size;
	if (size !== undefined && size > 0) parts.push(formatBytes(size));
	const context = metadata.context ?? metadata.contextTrain;
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
	const architecture = lookupRecord(entry, "architecture");
	const modalities = lookupArray(architecture, "input_modalities");
	let image = false;
	if (modalities !== undefined) {
		for (const modality of modalities) {
			if (modality === "image") image = true;
		}
	}
	const metadata = catalogMetadataOf(entry, statusRecord);
	const progress = lookupRecord(statusRecord, "progress");
	const totals = progress !== undefined ? progressTotals(progress) : undefined;
	return {
		id,
		status,
		failed,
		detail: describeModel(entry, statusRecord, status, failed),
		ratio: totals !== undefined ? Math.min(1, totals.done / totals.total) : undefined,
		bytes: totals !== undefined ? `${formatBytes(totals.done)} / ${formatBytes(totals.total)}` : undefined,
		context: metadata.context,
		contextTrain: metadata.contextTrain,
		ftype: metadata.ftype,
		size: metadata.size,
		image,
	};
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

/**
 * Decode one server-sent frame into a router model event, if it carries one.
 * @param frame Raw frame text between two blank lines
 * @returns The event, or undefined when the frame is not a model event
 */
function parseModelEvent(frame: string): LlamaRouterEvent | undefined {
	let payload = "";
	for (const line of frame.split("\n")) {
		if (!line.startsWith("data:")) continue;
		payload += (payload.length > 0 ? "\n" : "") + line.slice(5).trimStart();
	}
	if (payload.length === 0) return undefined;
	const parsed = safeParse(payload);
	const model = lookupString(parsed, "model");
	const name = lookupString(parsed, "event");
	if (model === undefined || name === undefined) return undefined;
	return { model, event: name, data: lookupRecord(parsed, "data") };
}

/**
 * Subscribe to the router's model status stream. Every chunk means the catalog
 * may have changed, which is all a polling loop needs to re-read immediately,
 * and decoded model events are handed over so a progress view can render them.
 * The subscription ends when the signal aborts or the stream drops; callers
 * keep their polling fallback for both cases.
 * @param server Router to watch
 * @param onChange Called once per stream chunk
 * @param onEvent Called for every frame that carries a model event
 * @param signal Cancels the subscription
 * @returns Unsubscribe function
 */
export function watchLlamaModels(
	server: LlamaRouterServer,
	onChange: () => void,
	onEvent: (event: LlamaRouterEvent) => void,
	signal: AbortSignal,
): () => void {
	let stopped = false;
	const stop = (): void => {
		stopped = true;
	};
	void (async (): Promise<void> => {
		try {
			const url = `${llamaRouterRoot(server.baseUrl)}/models/sse`;
			const response = await fetch(url, { headers: requestHeaders(server, false), signal });
			if (!response.ok) return;
			const body = response.body;
			if (!body) return;
			const reader = body.getReader();
			const decoder = new TextDecoder("utf-8");
			let buffer = "";
			let pendingBytes: Uint8Array | undefined;
			while (!stopped) {
				const chunk = await reader.read();
				if (chunk.done) return;
				const value: Uint8Array = chunk.value;
				const bytes: Uint8Array =
					pendingBytes !== undefined && pendingBytes.length > 0 ? joinBytes(pendingBytes, value) : value;
				const tailLength = incompleteUtf8TailLength(bytes);
				pendingBytes = tailLength > 0 ? bytes.slice(bytes.length - tailLength) : undefined;
				const safeBytes: Uint8Array = tailLength > 0 ? bytes.slice(0, bytes.length - tailLength) : bytes;
				buffer += decoder.decode(safeBytes).split("\r\n").join("\n");
				onChange();
				let boundary = buffer.indexOf("\n\n");
				while (boundary >= 0) {
					const frame = buffer.slice(0, boundary);
					buffer = buffer.slice(boundary + 2);
					const event = parseModelEvent(frame);
					if (event !== undefined) onEvent(event);
					boundary = buffer.indexOf("\n\n");
				}
			}
		} catch {
			return;
		}
	})();
	return stop;
}

/** Concatenate a carried partial UTF-8 tail with the next chunk of bytes. */
function joinBytes(head: Uint8Array, tail: Uint8Array): Uint8Array {
	const merged = new Uint8Array(head.length + tail.length);
	merged.set(head, 0);
	merged.set(tail, head.length);
	return merged;
}

function resultFromError(error: unknown, signal: AbortSignal): LlamaRouterResult {
	if (signal.aborted) return { ok: false, cancelled: true, error: undefined };
	return { ok: false, cancelled: false, error: errorText(error) };
}

/**
 * Load progress from a model status event: the stage list the chat template
 * work is reported in, folded into one ratio over all stages.
 * @param event Router event to read
 * @returns The progress, or undefined when the event carries none
 */
function stageProgressFromEvent(event: LlamaRouterEvent): LlamaLoadProgress | undefined {
	if (event.event !== "model_status" && event.event !== "status_change") return undefined;
	const progress = lookupRecord(event.data, "progress");
	if (progress === undefined) return undefined;
	const stage = lookupString(progress, "current") ?? lookupString(progress, "stage");
	const stageNames: string[] = [];
	const stages = lookupArray(progress, "stages");
	if (stages !== undefined) {
		for (const entry of stages) {
			if (typeof entry === "string") stageNames.push(entry);
		}
	}
	let ratio = lookupNumber(progress, "value");
	if (ratio !== undefined) ratio = Math.max(0, Math.min(1, ratio));
	if (stage !== undefined && stageNames.length > 0) {
		const index = stageNames.indexOf(stage);
		if (index >= 0) ratio = (index + (ratio ?? 0)) / stageNames.length;
	}
	return {
		message: stage !== undefined ? `Loading ${stage.split("_").join(" ")}` : "Loading model",
		ratio,
		detail: undefined,
	};
}

/**
 * Download progress from a download event: byte counters per file, summed.
 * @param event Router event to read
 * @returns The progress, or undefined when the event carries none
 */
function downloadProgressFromEvent(event: LlamaRouterEvent): LlamaLoadProgress | undefined {
	if (event.event !== "download_progress") return undefined;
	const files = lookupRecord(event.data, "progress") ?? event.data;
	if (files === undefined) return undefined;
	const totals = progressTotals(files);
	if (totals === undefined) return undefined;
	return {
		message: "Downloading model",
		ratio: Math.min(1, totals.done / totals.total),
		detail: `${formatBytes(totals.done)} / ${formatBytes(totals.total)}`,
	};
}

/**
 * Ask the router to load one model and wait until it reports loaded. Progress
 * updates carry a status line, a ratio when the server reports one, and byte
 * counts for the detail line.
 */
export async function loadLlamaModel(
	server: LlamaRouterServer,
	modelId: string,
	onProgress: (progress: LlamaLoadProgress) => void,
	signal: AbortSignal,
): Promise<LlamaRouterResult> {
	const deadline = Date.now() + LOAD_TIMEOUT_MS;
	onProgress({ message: "Starting…", ratio: undefined, detail: undefined });
	try {
		await requestJson(server, "/models/load", "POST", JSON.stringify({ model: modelId }), signal);
	} catch (error) {
		return resultFromError(error, signal);
	}
	onProgress({ message: "Loading model", ratio: undefined, detail: undefined });
	let stageProgress: LlamaLoadProgress | undefined;
	let eventWake: (() => void) | undefined;
	const wake = (): void => {
		const pending = eventWake;
		eventWake = undefined;
		if (pending !== undefined) pending();
	};
	const stopWatch = watchLlamaModels(
		server,
		wake,
		(event) => {
			if (event.model !== modelId) return;
			const stage = stageProgressFromEvent(event);
			if (stage !== undefined) {
				stageProgress = stage;
				onProgress(stage);
				return;
			}
			const download = downloadProgressFromEvent(event);
			if (download !== undefined) onProgress(download);
		},
		signal,
	);
	try {
		while (Date.now() < deadline) {
			try {
				const eventWait = new Promise<void>((resolve) => {
					eventWake = resolve;
				});
				await Promise.race([sleep(LOAD_POLL_INTERVAL_MS, signal), eventWait]);
				const model = findLlamaModel(await listLlamaModels(server, signal), modelId);
				if (model === undefined) return { ok: true, cancelled: false, error: undefined };
				if (model.status === "loaded") return { ok: true, cancelled: false, error: undefined };
				if (model.failed || model.status === "unloaded") {
					return { ok: false, cancelled: false, error: `Model ${modelId} failed to load` };
				}
				let message = "Loading model";
				let ratio: number | undefined;
				let detail: string | undefined;
				if (model.status === "downloading") {
					message = "Downloading model";
					ratio = model.ratio;
					detail = model.bytes;
				} else if (stageProgress !== undefined) {
					message = stageProgress.message;
					ratio = stageProgress.ratio;
					detail = stageProgress.detail;
				} else {
					ratio = model.ratio;
					detail = model.bytes;
				}
				onProgress({ message, ratio, detail });
			} catch (error) {
				return resultFromError(error, signal);
			}
		}
	} finally {
		stopWatch();
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
