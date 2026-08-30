import { join } from "node:path";
import type { ModelsStoreEntry, ModelsStoreOperationOptions } from "../../../ai/src/index.ts";
import { ModelsStore } from "../../../ai/src/index.ts";

/** Abort the pending operation when its request signal is already aborted. */
function throwIfSignalAborted(options?: ModelsStoreOperationOptions): void {
	const signal = options?.signal;
	if (signal) signal.throwIfAborted();
}
import { getAgentDir } from "../config.ts";
import { raceWithAbortSignal } from "../utils/abort.ts";
import { getFileRevision, normalizePath } from "../utils/paths.ts";
import { stripBom } from "../utils/text.ts";
import { type AuthStorageBackend, type LockResult, FileAuthStorageBackend } from "./auth-storage.ts";

type StoredModels = Record<string, ModelsStoreEntry>;

type ModelsFileReload = {
	controller: AbortController;
	promise: Promise<StoredModels>;
	readers: number;
};

type ModelsFileReadState = {
	data: StoredModels;
	revision?: string;
	reload?: ModelsFileReload;
};

// Optimize the common path without retaining an unbounded set of custom paths.
let sharedModelsFileReadState: { path: string; readState: ModelsFileReadState } | undefined;

export class InMemoryCodingAgentModelsStore extends ModelsStore {
	private readonly entries = new Map<string, ModelsStoreEntry>();

	read(providerId: string, options?: ModelsStoreOperationOptions): Promise<ModelsStoreEntry | undefined> {
		return this.readAsync(providerId, options);
	}

	private async readAsync(providerId: string, options?: ModelsStoreOperationOptions): Promise<ModelsStoreEntry | undefined> {
		throwIfSignalAborted(options);
		const entry = this.entries.get(providerId);
		return entry ? structuredClone(entry) : undefined;
	}

	write(providerId: string, entry: ModelsStoreEntry, options?: ModelsStoreOperationOptions): Promise<void> {
		return this.writeAsync(providerId, entry, options);
	}

	private async writeAsync(providerId: string, entry: ModelsStoreEntry, options?: ModelsStoreOperationOptions): Promise<void> {
		throwIfSignalAborted(options);
		this.entries.set(providerId, structuredClone(entry));
	}

	delete(providerId: string, options?: ModelsStoreOperationOptions): Promise<void> {
		return this.deleteAsync(providerId, options);
	}

	private async deleteAsync(providerId: string, options?: ModelsStoreOperationOptions): Promise<void> {
		throwIfSignalAborted(options);
		this.entries.delete(providerId);
	}
}

/** Locked JSON-backed storage for dynamically refreshed provider catalogs. */
export class FileModelsStore extends ModelsStore {
	private readonly storage: AuthStorageBackend;
	private readonly path: string;
	private readonly readState: ModelsFileReadState;

	constructor(path: string = join(getAgentDir(), "models-store.json")) {
		super();
		this.path = normalizePath(path);
		this.storage = new FileAuthStorageBackend(this.path);
		this.readState =
			sharedModelsFileReadState?.path === this.path ? sharedModelsFileReadState.readState : { data: {} };
		if (!sharedModelsFileReadState) {
			sharedModelsFileReadState = { path: this.path, readState: this.readState };
		}
	}

	private parse(content: string | undefined): StoredModels {
		return content ? (JSON.parse(stripBom(content)) as StoredModels) : {};
	}

	private updateReadState(readState: ModelsFileReadState, data: StoredModels, revision?: string): void {
		readState.data = data;
		readState.revision = revision;
	}

	private async reloadFromStorage(
		readState: ModelsFileReadState,
		options?: ModelsStoreOperationOptions,
	): Promise<StoredModels> {
		let result: StoredModels = {};
		await this.storage.withLockAsync(async (content): Promise<LockResult<unknown>> => {
			const data = this.parse(content);
			this.updateReadState(readState, data, getFileRevision(this.path));
			result = data;
			return { result: data };
		}, options);
		return result;
	}

	private async readLatest(
		readState: ModelsFileReadState,
		options?: ModelsStoreOperationOptions,
	): Promise<StoredModels> {
		const signal = options?.signal;
		if (signal !== undefined) signal.throwIfAborted();
		const revision = getFileRevision(this.path);
		if (revision !== undefined && revision === readState.revision) return readState.data;
		if (!readState.reload) {
			const controller = new AbortController();
			const reload: ModelsFileReload = {
				controller,
				promise: this.reloadFromStorage(readState, { signal: controller.signal }),
				readers: 0,
			};
			readState.reload = reload;
			void reload.promise
				.then(() => {
					if (readState.reload === reload) readState.reload = undefined;
				})
				.catch(() => {
					if (readState.reload === reload) readState.reload = undefined;
				});
		}

		const reload = readState.reload;
		reload.readers++;
		try {
			return (await raceWithAbortSignal(reload.promise, options?.signal)) as StoredModels;
		} finally {
			reload.readers--;
			if (reload.readers === 0 && readState.reload === reload) {
				readState.reload = undefined;
				reload.controller.abort();
			}
		}
	}

	read(providerId: string, options?: ModelsStoreOperationOptions): Promise<ModelsStoreEntry | undefined> {
		return this.readAsync(providerId, options);
	}

	private async readAsync(providerId: string, options?: ModelsStoreOperationOptions): Promise<ModelsStoreEntry | undefined> {
		const entry = (await this.readLatest(this.readState, options))[providerId];
		throwIfSignalAborted(options);
		return entry ? structuredClone(entry) : undefined;
	}

	write(providerId: string, entry: ModelsStoreEntry, options?: ModelsStoreOperationOptions): Promise<void> {
		return this.writeAsync(providerId, entry, options);
	}

	private async writeAsync(providerId: string, entry: ModelsStoreEntry, options?: ModelsStoreOperationOptions): Promise<void> {
		let latest: StoredModels | undefined;
		await this.storage.withLockAsync(async (content): Promise<LockResult<unknown>> => {
			const current = this.parse(content);
			current[providerId] = structuredClone(entry);
			latest = current;
			return { result: undefined, next: JSON.stringify(current, null, 2) };
		}, options);
		if (latest) this.updateReadState(this.readState, latest);
	}

	delete(providerId: string, options?: ModelsStoreOperationOptions): Promise<void> {
		return this.deleteAsync(providerId, options);
	}

	private async deleteAsync(providerId: string, options?: ModelsStoreOperationOptions): Promise<void> {
		let latest: StoredModels | undefined;
		await this.storage.withLockAsync(async (content): Promise<LockResult<unknown>> => {
			const current = this.parse(content);
			delete current[providerId];
			latest = current;
			return { result: undefined, next: JSON.stringify(current, null, 2) };
		}, options);
		if (latest) this.updateReadState(this.readState, latest);
	}
}
