import { operationSignal, raceWithAbortSignal } from "../utils/abort.ts";
import { CredentialStore } from "./types.ts";
import type { AuthOperationOptions, Credential, CredentialInfo } from "./types.ts";

/** Abort the pending operation when its request signal is already aborted. */
function throwIfSignalAborted(options?: AuthOperationOptions): void {
	const signal = options?.signal;
	if (signal) signal.throwIfAborted();
}

/**
 * Default in-memory credential store. Apps inject persistent stores.
 * Keyed by `Provider.id`, one credential per provider; see `CredentialStore`.
 * Writes are serialized per provider through a promise chain.
 */
export class InMemoryCredentialStore extends CredentialStore {
	private credentials = new Map<string, Credential>();
	private chains = new Map<string, Promise<unknown>>();

	/** Serialize tasks per provider id without releasing the chain before active work settles. */
	private enqueue<T>(providerId: string, task: () => Promise<T>, options?: AuthOperationOptions): Promise<T> {
		const signal = operationSignal(options?.signal);
		const previous = this.chains.get(providerId) ?? Promise.resolve();
		const queued = (async () => {
			await previous.catch(() => {});
			signal.throwIfAborted();
			return task();
		})();
		const tail = queued.catch(() => {});
		this.chains.set(providerId, tail);
		void tail.then(() => {
			if (this.chains.get(providerId) === tail) this.chains.delete(providerId);
		});
		return raceWithAbortSignal(queued, signal);
	}

	read(providerId: string, options?: AuthOperationOptions): Promise<Credential | undefined> {
		return Promise.resolve(this.readSync(providerId, options));
	}

	private readSync(providerId: string, options?: AuthOperationOptions): Credential | undefined {
		throwIfSignalAborted(options);
		return this.credentials.get(providerId);
	}

	list(options?: AuthOperationOptions): Promise<readonly CredentialInfo[]> {
		return Promise.resolve(this.listSync());
	}

	private listSync(): readonly CredentialInfo[] {
		const out: CredentialInfo[] = [];
		for (const [providerId, credential] of this.credentials.entries()) {
			out.push({ providerId, type: credential.type });
		}
		return out;
	}

	modify(
		providerId: string,
		fn: (current: Credential | undefined) => Promise<Credential | undefined>,
		options?: AuthOperationOptions,
	): Promise<Credential | undefined> {
		return this.enqueue(
			providerId,
			async () => {
				const current = this.credentials.get(providerId);
				const next = await fn(current);
				throwIfSignalAborted(options);
				if (next !== undefined) this.credentials.set(providerId, next);
				return next ?? current;
			},
			options,
		);
	}

	delete(providerId: string, options?: AuthOperationOptions): Promise<void> {
		return this.enqueue(
			providerId,
			async () => {
				this.credentials.delete(providerId);
			},
			options,
		);
	}
}
