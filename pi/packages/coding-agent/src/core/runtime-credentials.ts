import type { AuthOperationOptions, Credential, CredentialInfo } from "../../../ai/src/index.ts";
import { CredentialStore } from "../../../ai/src/index.ts";

/** Abort the pending operation when its request signal is already aborted. */
function throwIfSignalAborted(options?: AuthOperationOptions): void {
	const signal = options?.signal;
	if (signal) signal.throwIfAborted();
}

/** Async credential store overlay for non-persistent runtime API keys. */
export class RuntimeCredentials extends CredentialStore {
	private readonly store: CredentialStore;
	private readonly overrides = new Map<string, string>();

	constructor(store: CredentialStore) {
		super();
		this.store = store;
	}

	setRuntimeApiKey(providerId: string, apiKey: string): void {
		this.overrides.set(providerId, apiKey);
	}

	removeRuntimeApiKey(providerId: string): void {
		this.overrides.delete(providerId);
	}

	hasRuntimeApiKey(providerId: string): boolean {
		return this.overrides.has(providerId);
	}

	read(providerId: string, options?: AuthOperationOptions): Promise<Credential | undefined> {
		const signal = options?.signal;
		if (signal) signal.throwIfAborted();
		const override = this.overrides.get(providerId);
		if (override) {
			const overrideCredential: Credential = { type: "api_key", key: override };
			return Promise.resolve<Credential | undefined>(overrideCredential);
		}
		return this.store.read(providerId, options);
	}

	list(options?: AuthOperationOptions): Promise<readonly CredentialInfo[]> {
		return this.listAsync(options);
	}

	private async listAsync(options?: AuthOperationOptions): Promise<readonly CredentialInfo[]> {
		const signal = options?.signal;
		const entries = new Map<string, CredentialInfo>();
		for (const entry of await this.store.list(options)) entries.set(entry.providerId, entry);
		if (signal) signal.throwIfAborted();
		for (const providerId of this.overrides.keys()) {
			entries.set(providerId, { providerId, type: "api_key" });
		}
		return [...entries.values()];
	}

	modify(
		providerId: string,
		fn: (current: Credential | undefined) => Promise<Credential | undefined>,
		options?: AuthOperationOptions,
	): Promise<Credential | undefined> {
		return this.store.modify(providerId, fn, options);
	}

	delete(providerId: string, options?: AuthOperationOptions): Promise<void> {
		return this.deleteAsync(providerId, options);
	}

	private async deleteAsync(providerId: string, options?: AuthOperationOptions): Promise<void> {
		throwIfSignalAborted(options);
		await this.store.delete(providerId, options);
		this.overrides.delete(providerId);
	}
}
