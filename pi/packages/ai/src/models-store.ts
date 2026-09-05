import type { Api, Model } from "./types.ts";

/** Abort the pending operation when its request signal is already aborted. */
function throwIfSignalAborted(options?: ModelsStoreOperationOptions): void {
	const signal = options?.signal;
	if (signal) signal.throwIfAborted();
}

export interface ModelsStoreEntry {
	models: readonly Model<Api>[];
	/** Unix timestamp from the remote catalog's Last-Modified header. */
	lastModified?: number;
	/** Unix timestamp of the last completed remote check. */
	checkedAt?: number;
	/**
	 * Opaque validator from the remote catalog's ETag header, stored verbatim
	 * (quotes included) and echoed back as If-None-Match.
	 */
	etag?: string;
}

export interface ModelsStoreOperationOptions {
	signal?: AbortSignal;
}

/** Persistent model catalogs keyed by provider ID. */
export abstract class ModelsStore {
	abstract read(providerId: string, options?: ModelsStoreOperationOptions): Promise<ModelsStoreEntry | undefined>;
	abstract write(providerId: string, entry: ModelsStoreEntry, options?: ModelsStoreOperationOptions): Promise<void>;
	abstract delete(providerId: string, options?: ModelsStoreOperationOptions): Promise<void>;
}

export class InMemoryModelsStore extends ModelsStore {
	private readonly entries = new Map<string, ModelsStoreEntry>();

	read(providerId: string, _options?: ModelsStoreOperationOptions): Promise<ModelsStoreEntry | undefined> {
		return Promise.resolve(this.readSync(providerId));
	}

	private readSync(providerId: string): ModelsStoreEntry | undefined {
		const entry = this.entries.get(providerId);
		return entry ? structuredClone(entry) : undefined;
	}

	write(providerId: string, entry: ModelsStoreEntry, options?: ModelsStoreOperationOptions): Promise<void> {
		throwIfSignalAborted(options);
		this.entries.set(providerId, structuredClone(entry));
		return Promise.resolve();
	}

	delete(providerId: string, options?: ModelsStoreOperationOptions): Promise<void> {
		throwIfSignalAborted(options);
		this.entries.delete(providerId);
		return Promise.resolve();
	}
}
