/**
 * CredentialStore implementation backed by auth.json.
 * Provider auth orchestration belongs to ModelRuntime and pi-ai Models.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { AuthOperationOptions, Credential, CredentialInfo } from "../../../ai/src/index.ts";
import { CredentialStore } from "../../../ai/src/index.ts";
import { getAgentDir } from "../config.ts";
import { abortReason, raceWithAbortSignal } from "../utils/abort.ts";
import lockfile from "../utils/mini-lockfile.ts";
import { getFileRevision, normalizePath } from "../utils/paths.ts";
import { sleep } from "../utils/sleep.ts";
import { stripBom } from "../utils/text.ts";
import { isCommandConfigValue, resolveConfigValue } from "./resolve-config-value.ts";

type AuthStorageData = Record<string, Credential>;

/** Concrete-typed race with abort (generic Promise<unknown> slots reject index-signature inners). */
function raceAuthDataWithAbort(
	operation: Promise<AuthStorageData>,
	signal: AbortSignal | undefined,
): Promise<AuthStorageData> {
	if (!signal) return operation;
	if (signal.aborted) {
		void operation.catch(() => {});
		return Promise.reject(abortReason(signal));
	}
	return new Promise<AuthStorageData>((resolve, reject) => {
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

export type LockResult<T> = {
	result: T;
	next?: string;
};

type AuthFileReload = {
	controller: AbortController;
	promise: Promise<AuthStorageData>;
	readers: number;
};

type AuthFileReadState = {
	data: AuthStorageData;
	revision?: string;
	reload?: AuthFileReload;
};

let sharedAuthFileReadState: { authPath: string; readState: AuthFileReadState } | undefined;

export abstract class AuthStorageBackend {
	abstract withLock(fn: (current: string | undefined) => LockResult<unknown>): unknown;
	abstract withLockAsync(
		fn: (current: string | undefined) => Promise<LockResult<unknown>>,
		options?: AuthOperationOptions,
	): Promise<unknown>;
}

/** Abort the pending operation when its request signal is already aborted. */
function throwIfSignalAborted(options?: AuthOperationOptions): void {
	const signal = options?.signal;
	if (signal) signal.throwIfAborted();
}

/** View a credential as a plain record (the Credential union resists direct field access). */
function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

function credentialRecordOf(credential: Credential): Record<string, unknown> {
	return JSON.parse(JSON.stringify(credential)) as Record<string, unknown>;
}

export class FileAuthStorageBackend extends AuthStorageBackend {
	private authPath: string;

	constructor(authPath: string = join(getAgentDir(), "auth.json")) {
		super();
		this.authPath = normalizePath(authPath);
	}

	private ensureParentDir(): void {
		const dir = dirname(this.authPath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true, mode: 0o700 });
		}
	}

	private ensureFileExists(): void {
		if (!existsSync(this.authPath)) {
			writeFileSync(this.authPath, "{}");
		}
	}

	private acquireLockSyncWithRetry(path: string): () => void {
		const maxAttempts = 10;
		const delayMs = 20;
		let lastError: unknown;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return lockfile.lockSync(path, { realpath: false });
			} catch (error) {
				const code = error instanceof Error && error.name === "LockError" ? "ELOCKED" : undefined;
				if (code !== "ELOCKED" || attempt === maxAttempts) {
					throw error;
				}
				lastError = error;
				const start = Date.now();
				while (Date.now() - start < delayMs) {
					// Sleep synchronously to avoid changing callers to async.
				}
			}
		}

		if (lastError instanceof Error && lastError.name === "LockError") throw lastError;
		throw new Error("Failed to acquire auth storage lock");
	}

	withLock(fn: (current: string | undefined) => LockResult<unknown>): unknown {
		this.ensureParentDir();
		this.ensureFileExists();

		let release: (() => void) | undefined;
		try {
			release = this.acquireLockSyncWithRetry(this.authPath);
			const current = existsSync(this.authPath) ? readFileSync(this.authPath, "utf-8") : undefined;
			const { result, next } = fn(current);
			if (next !== undefined) {
				writeFileSync(this.authPath, next);
			}
			return result;
		} finally {
			if (release) {
				release();
			}
		}
	}

	private async acquireLockAsync(
		signal: AbortSignal | undefined,
		onCompromised: (error: Error) => void,
	): Promise<() => Promise<void>> {
		const staleMs = 30_000;
		const maxDelayMs = 2_000;
		const deadline = Date.now() + staleMs;
		let retry = 0;
		while (true) {
			if (signal !== undefined) signal.throwIfAborted();
			let release: (() => Promise<void>) | undefined;
			try {
				release = await lockfile.lock(this.authPath, {
					realpath: false,
					retries: 0,
					stale: staleMs,
					onCompromised,
				});
			} catch (error) {
				if (signal !== undefined) signal.throwIfAborted();
				const code = error instanceof Error && error.name === "LockError" ? "ELOCKED" : undefined;
				const remainingMs = deadline - Date.now();
				if (code !== "ELOCKED" || remainingMs <= 0) throw error;
				const baseDelayMs = Math.min(10 * 2 ** retry, maxDelayMs / 2);
				retry++;
				const delayMs = Math.min(Math.round(baseDelayMs * (1 + Math.random())), remainingMs);
				await sleep(delayMs, signal);
				continue;
			}
			if (signal !== undefined && signal.aborted) {
				await release();
				signal.throwIfAborted();
			}
			return release;
		}
	}

	withLockAsync(
		fn: (current: string | undefined) => Promise<LockResult<unknown>>,
		options?: AuthOperationOptions,
	): Promise<unknown> {
		return this.withLockAsyncImpl(fn, options);
	}

	private async withLockAsyncImpl(
		fn: (current: string | undefined) => Promise<LockResult<unknown>>,
		options?: AuthOperationOptions,
	): Promise<unknown> {
		throwIfSignalAborted(options);
		this.ensureParentDir();
		this.ensureFileExists();

		let release: (() => Promise<void>) | undefined;
		let lockCompromised = false;
		let lockCompromisedError: Error | undefined;
		const throwIfCompromised = () => {
			if (lockCompromised) {
				throw lockCompromisedError ?? new Error("Auth storage lock was compromised");
			}
		};

		try {
			release = await this.acquireLockAsync(options?.signal, (error) => {
				lockCompromised = true;
				lockCompromisedError = error;
			});

			throwIfCompromised();
			throwIfSignalAborted(options);
			const current = existsSync(this.authPath) ? readFileSync(this.authPath, "utf-8") : undefined;
			const { result, next } = await fn(current);
			throwIfCompromised();
			throwIfSignalAborted(options);
			if (next !== undefined) {
				writeFileSync(this.authPath, next);
			}
			throwIfCompromised();
			return result;
		} finally {
			if (release) {
				try {
					await release();
				} catch {
					// Ignore unlock errors when lock is compromised.
				}
			}
		}
	}
}

export class ReadOnlyAuthStorage extends CredentialStore {
	private readonly authPath: string;
	private data: AuthStorageData | undefined;

	constructor(authPath: string = join(getAgentDir(), "auth.json")) {
		super();
		this.authPath = normalizePath(authPath);
	}

	private load(): AuthStorageData {
		if (this.data) return this.data;

		let parsed: unknown;
		try {
			parsed = JSON.parse(stripBom(readFileSync(this.authPath, "utf-8")));
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				this.data = {};
				return this.data;
			}
			throw new Error(`Failed to read auth.json: ${error instanceof Error ? error.message : String(error)}`);
		}

		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			throw new Error("Invalid auth.json: expected an object");
		}
		for (const [providerId, credential] of Object.entries(parsed)) {
			if (typeof credential !== "object" || credential === null || Array.isArray(credential)) {
				throw new Error(`Invalid auth.json credential for provider "${providerId}"`);
			}
			const value = credentialRecordOf(credential);
			if (value["type"] === "api_key") {
				const validKey = value.key === undefined || typeof value.key === "string";
				const validEnv =
					value.env === undefined ||
					(typeof value.env === "object" &&
						value.env !== null &&
						!Array.isArray(value.env) &&
						Object.values(value.env).every((entry) => typeof entry === "string"));
				if (validKey && validEnv) continue;
			} else if (
				value.type === "oauth" &&
				typeof value.access === "string" &&
				typeof value.refresh === "string" &&
				typeof value.expires === "number" &&
				Number.isFinite(value.expires)
			) {
				continue;
			}
			throw new Error(`Invalid auth.json credential for provider "${providerId}"`);
		}

		this.data = parsed as AuthStorageData;
		return this.data;
	}

	read(providerId: string, options?: AuthOperationOptions): Promise<Credential | undefined> {
		return this.readAsync(providerId, options);
	}

	private async readAsync(providerId: string, options?: AuthOperationOptions): Promise<Credential | undefined> {
		throwIfSignalAborted(options);
		const credential = recordViewOf(this.load())[providerId] as Credential | undefined;
		throwIfSignalAborted(options);
		if (!credential) return undefined;
		const record = credentialRecordOf(credential);
		if (record["type"] !== "api_key") return structuredClone(credential);
		const key = record["key"];
		if (typeof key !== "string" || key === "" || isCommandConfigValue(key)) return structuredClone(credential);
		const env = record["env"];
		const resolvedEnv = env === undefined || env === null ? undefined : (env as Record<string, string>);
		return { type: "api_key", key: resolveConfigValue(key, resolvedEnv), env: resolvedEnv };
	}

	list(options?: AuthOperationOptions): Promise<readonly CredentialInfo[]> {
		return Promise.resolve(this.listSync(options));
	}

	private listSync(options?: AuthOperationOptions): readonly CredentialInfo[] {
		throwIfSignalAborted(options);
		const credentials = Object.entries(this.load()).map(([providerId, credential]) => ({
			providerId,
			type: credential.type,
		}));
		throwIfSignalAborted(options);
		return credentials;
	}

	modify(
		_providerId: string,
		_fn: (current: Credential | undefined) => Promise<Credential | undefined>,
		_options?: AuthOperationOptions,
	): Promise<Credential | undefined> {
		return Promise.reject(new Error("Read-only credential storage cannot modify auth.json"));
	}

	delete(_providerId: string, _options?: AuthOperationOptions): Promise<void> {
		return Promise.reject(new Error("Read-only credential storage cannot modify auth.json"));
	}
}

export class InMemoryAuthStorageBackend extends AuthStorageBackend {
	private value: string | undefined;
	private asyncChain: Promise<unknown> = Promise.resolve();

	withLock(fn: (current: string | undefined) => LockResult<unknown>): unknown {
		const { result, next } = fn(this.value);
		if (next !== undefined) {
			this.value = next;
		}
		return result;
	}

	withLockAsync(
		fn: (current: string | undefined) => Promise<LockResult<unknown>>,
		options?: AuthOperationOptions,
	): Promise<unknown> {
		const previous = this.asyncChain;
		const operation = (async () => {
			await previous.catch(() => {});
			throwIfSignalAborted(options);
			const { result, next } = await fn(this.value);
			throwIfSignalAborted(options);
			if (next !== undefined) {
				this.value = next;
			}
			return result;
		})();
		this.asyncChain = operation.catch(() => {});
		return raceWithAbortSignal(operation, options?.signal);
	}
}

/**
 * Credential storage backed by a JSON file.
 */
export class AuthStorage extends CredentialStore {
	private storage: AuthStorageBackend;
	private authPath: string | undefined;
	private readState: AuthFileReadState;

	private constructor(storage: AuthStorageBackend, authPath?: string) {
		super();
		this.storage = storage;
		this.authPath = authPath;
		this.readState =
			authPath && sharedAuthFileReadState?.authPath === authPath ? sharedAuthFileReadState.readState : { data: {} };
		if (authPath && !sharedAuthFileReadState) {
			sharedAuthFileReadState = { authPath, readState: this.readState };
		}
		if (authPath) {
			const revision = getFileRevision(authPath);
			if (revision !== undefined && revision === this.readState.revision) return;
		}
		this.reload();
	}

	static create(authPath: string = join(getAgentDir(), "auth.json")): AuthStorage {
		const normalizedAuthPath = normalizePath(authPath);
		return new AuthStorage(new FileAuthStorageBackend(normalizedAuthPath), normalizedAuthPath);
	}

	static fromStorage(storage: AuthStorageBackend): AuthStorage {
		return new AuthStorage(storage);
	}

	static inMemory(data: AuthStorageData = {}): AuthStorage {
		const storage = new InMemoryAuthStorageBackend();
		storage.withLock(() => ({ result: undefined, next: JSON.stringify(data, null, 2) }));
		return AuthStorage.fromStorage(storage);
	}

	private parseStorageData(content: string | undefined): AuthStorageData {
		if (!content) {
			return {};
		}
		return JSON.parse(stripBom(content)) as AuthStorageData;
	}

	private updateReadState(data: AuthStorageData, revision?: string): void {
		this.readState.data = data;
		this.readState.revision = revision;
	}

	/**
	 * Reload credentials from storage.
	 */
	reload(): void {
		let content: string | undefined;
		let revision: string | undefined;
		try {
			this.storage.withLock((current): LockResult<unknown> => {
				content = current;
				revision = this.authPath ? getFileRevision(this.authPath) : undefined;
				return { result: undefined };
			});
			this.updateReadState(this.parseStorageData(content), revision);
		} catch {
			// Preserve the last valid in-memory snapshot.
		}
	}

	private async reloadFromStorageAsync(options?: AuthOperationOptions): Promise<AuthStorageData> {
		let result: AuthStorageData = {};
		await this.storage.withLockAsync(async (content): Promise<LockResult<unknown>> => {
			const currentData = this.parseStorageData(content);
			const revision = this.authPath ? getFileRevision(this.authPath) : undefined;
			this.updateReadState(currentData, revision);
			result = currentData;
			return { result: currentData };
		}, options);
		return result;
	}

	private async readLatestData(options?: AuthOperationOptions): Promise<AuthStorageData> {
		throwIfSignalAborted(options);
		if (!this.authPath) {
			const reload = this.reloadFromStorageAsync(options);
			return options?.signal ? reload : reload.catch(() => this.readState.data);
		}
		const revision = getFileRevision(this.authPath);
		if (revision !== undefined && revision === this.readState.revision) return this.readState.data;
		if (!this.readState.reload) {
			const controller = new AbortController();
			const reload: AuthFileReload = {
				controller,
				promise: this.reloadFromStorageAsync({ signal: controller.signal }),
				readers: 0,
			};
			this.readState.reload = reload;
			void reload.promise
				.then(() => {
					if (this.readState.reload === reload) this.readState.reload = undefined;
				})
				.catch(() => {
					if (this.readState.reload === reload) this.readState.reload = undefined;
				});
		}

		const reload = this.readState.reload;
		reload.readers++;
		try {
			const result = raceAuthDataWithAbort(reload.promise, options?.signal);
			const data: unknown = options?.signal ? await result : await result.catch(() => this.readState.data);
			return data as AuthStorageData;
		} finally {
			reload.readers--;
			if (reload.readers === 0 && this.readState.reload === reload) {
				this.readState.reload = undefined;
				reload.controller.abort();
			}
		}
	}

	read(provider: string, options?: AuthOperationOptions): Promise<Credential | undefined> {
		return this.readAsync(provider, options);
	}

	private async readAsync(provider: string, options?: AuthOperationOptions): Promise<Credential | undefined> {
		const credential = recordViewOf(await this.readLatestData(options))[provider] as Credential | undefined;
		throwIfSignalAborted(options);
		if (!credential) return undefined;
		const record = credentialRecordOf(credential);
		if (record["type"] !== "api_key") return credential;
		const key = record["key"];
		if (key === undefined || typeof key !== "string") return credential;
		const env = record["env"];
		const resolvedEnv = env === undefined || env === null ? undefined : (env as Record<string, string>);
		return { type: "api_key", key: resolveConfigValue(key, resolvedEnv), env: resolvedEnv };
	}

	modify(
		provider: string,
		fn: (current: Credential | undefined) => Promise<Credential | undefined>,
		options?: AuthOperationOptions,
	): Promise<Credential | undefined> {
		return this.modifyAsync(provider, fn, options);
	}

	private async modifyAsync(
		provider: string,
		fn: (current: Credential | undefined) => Promise<Credential | undefined>,
		options?: AuthOperationOptions,
	): Promise<Credential | undefined> {
		let latestData = this.readState.data;
		let revision: string | undefined;
		let result: Credential | undefined;
		await this.storage.withLockAsync(async (content): Promise<LockResult<unknown>> => {
			const currentData = this.parseStorageData(content);
			const next = await fn(recordViewOf(currentData)[provider] as Credential | undefined);
			if (next === undefined) {
				latestData = currentData;
				revision = this.authPath ? getFileRevision(this.authPath) : undefined;
				result = recordViewOf(currentData)[provider] as Credential | undefined;
				return { result: recordViewOf(currentData)[provider] as Credential | undefined };
			}

			const merged: AuthStorageData = { ...currentData, [provider]: next };
			latestData = merged;
			result = next;
			return { result: next, next: JSON.stringify(merged, null, 2) };
		}, options);
		this.updateReadState(latestData, revision);
		return result;
	}

	delete(provider: string, options?: AuthOperationOptions): Promise<void> {
		return this.deleteAsync(provider, options);
	}

	private async deleteAsync(provider: string, options?: AuthOperationOptions): Promise<void> {
		let latestData = this.readState.data;
		await this.storage.withLockAsync(async (content): Promise<LockResult<unknown>> => {
			const currentData = this.parseStorageData(content);
			delete currentData[provider];
			latestData = currentData;
			return { result: undefined, next: JSON.stringify(currentData, null, 2) };
		}, options);
		this.updateReadState(latestData);
	}

	/** List credential metadata without resolving configured key values. */
	list(options?: AuthOperationOptions): Promise<readonly CredentialInfo[]> {
		return this.listAsync(options);
	}

	private async listAsync(options?: AuthOperationOptions): Promise<readonly CredentialInfo[]> {
		const entries = Object.entries(await this.readLatestData(options));
		throwIfSignalAborted(options);
		return entries.map(([providerId, credential]) => ({ providerId, type: credential.type }));
	}
}

/**
 * One-off synchronous read of a stored credential from an auth.json file,
 * without instantiating a store or resolving configured key values.
 */
export function readStoredCredential(
	providerId: string,
	authPath: string = join(getAgentDir(), "auth.json"),
): Credential | undefined {
	try {
		const data = JSON.parse(stripBom(readFileSync(normalizePath(authPath), "utf-8"))) as AuthStorageData;
		return recordViewOf(data)[providerId] as Credential | undefined;
	} catch {
		return undefined;
	}
}
