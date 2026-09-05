import { getApiProvider } from "../../../ai/src/compat.ts";
import {
	type Api,
	type ApiKeyAuth,
	type ApiKeyCredential,
	type AssistantMessageEventStream,
	type AuthContext,
	type AuthResult,
	type Context,
	type Credential,
	lazyStream,
	type Model,
	type ModelAuth,
	type OAuthAuth,
	type OAuthCredential,
	type OAuthCredentials,
	type OAuthLoginCallbacks,
	type Provider,
	type ProviderAuthInteraction,
	type ProviderHeaders,
	type SimpleStreamOptions,
	type StreamOptions,
} from "../../../ai/src/index.ts";
import type { ModelConfig, ModelsJsonModel, ModelsJsonModelOverride, ModelsJsonProvider } from "./model-config.ts";
import {
	clearConfigValueCache,
	getConfigValueEnvVarNames,
	isCommandConfigValue,
	isConfigValueConfigured,
	resolveConfigValueOrThrow,
	resolveHeadersOrThrow,
} from "./resolve-config-value.ts";

export interface ExtensionOAuthConfig {
	name: string;
	/** Whether access through this auth method is backed by a provider subscription. */
	isSubscription?: boolean;
	/** @deprecated Retained for extension source compatibility; ignored by canonical auth flows. */
	usesCallbackServer?: boolean;
	login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials>;
	refreshToken(credentials: OAuthCredentials, signal: AbortSignal): Promise<OAuthCredentials>;
	getApiKey(credentials: OAuthCredentials): string;
	modifyModels?(models: Model<Api>[], credentials: OAuthCredentials): Model<Api>[];
}

/** Input type for the extension registerProvider API. */
export interface ProviderConfigInput {
	name?: string;
	baseUrl?: string;
	apiKey?: string;
	api?: Api;
	streamSimple?: (model: Model<Api>, context: Context, options?: SimpleStreamOptions) => AssistantMessageEventStream;
	headers?: Record<string, string>;
	authHeader?: boolean;
	oauth?: ExtensionOAuthConfig;
	models?: Array<{
		id: string;
		name: string;
		api?: Api;
		baseUrl?: string;
		reasoning: boolean;
		thinkingLevelMap?: Model<Api>["thinkingLevelMap"];
		input: ("text" | "image")[];
		cost: Model<Api>["cost"];
		contextWindow: number;
		maxTokens: number;
		samplingParams?: Record<string, unknown>;
		headers?: Record<string, string>;
		compat?: Model<Api>["compat"];
	}>;
}

export type AuthStatus = {
	configured: boolean;
	source?: "stored" | "runtime" | "environment" | "fallback" | "models_json_key" | "models_json_command";
	label?: string;
};

export const clearApiKeyCache = clearConfigValueCache;

function copyCompatRecord(source: unknown): Record<string, unknown> {
	const target: Record<string, unknown> = {};
	if (typeof source !== "object" || source === null) return target;
	const record = source as Record<string, unknown>;
	for (const key of Object.keys(record)) target[key] = record[key];
	return target;
}

function mergeStringRecords(...records: Array<Record<string, string> | undefined>): Record<string, string> {
	const merged: Record<string, string> = {};
	for (const record of records) {
		if (!record) continue;
		for (const key of Object.keys(record)) {
			merged[key] = record[key];
		}
	}
	return merged;
}

function mergeUnknownRecords(...records: Array<Record<string, unknown> | undefined>): Record<string, unknown> {
	const merged: Record<string, unknown> = {};
	for (const record of records) {
		if (!record) continue;
		for (const key of Object.keys(record)) merged[key] = record[key];
	}
	return merged;
}

function mergeCompat(base: unknown, override: unknown): unknown {
	if (override === undefined || override === null) return base;
	const baseRecord: Record<string, unknown> = copyCompatRecord(base);
	const overrideRecord: Record<string, unknown> = copyCompatRecord(override);
	const merged: Record<string, unknown> = copyCompatRecord(baseRecord);
	for (const key of Object.keys(overrideRecord)) merged[key] = overrideRecord[key];
	const nestedKeys = ["openRouterRouting", "vercelGatewayRouting", "chatTemplateKwargs", "chatTemplateArgs"];
	for (const key of nestedKeys) {
		const baseValue = baseRecord[key];
		const overrideValue = overrideRecord[key];
		const baseIsObject = typeof baseValue === "object" && baseValue !== null;
		const overrideIsObject = typeof overrideValue === "object" && overrideValue !== null;
		if (!baseIsObject && !overrideIsObject) continue;
		const mergedNested: Record<string, unknown> = baseIsObject
			? copyCompatRecord(baseValue as Record<string, unknown>)
			: {};
		if (overrideIsObject) {
			const overrideNested = overrideValue as Record<string, unknown>;
			for (const nestedKey of Object.keys(overrideNested)) mergedNested[nestedKey] = overrideNested[nestedKey];
		}
		merged[key] = mergedNested;
	}
	return merged;
}

function applyModelOverride(model: Model<Api>, override: ModelsJsonModelOverride): Model<Api> {
	return {
		...model,
		name: override.name ?? model.name,
		reasoning: override.reasoning ?? model.reasoning,
		thinkingLevelMap: override.thinkingLevelMap
			? { ...model.thinkingLevelMap, ...override.thinkingLevelMap }
			: model.thinkingLevelMap,
		input: (override.input as ("text" | "image")[] | undefined) ?? model.input,
		cost: override.cost
			? {
					input: override.cost.input ?? model.cost.input,
					output: override.cost.output ?? model.cost.output,
					cacheRead: override.cost.cacheRead ?? model.cost.cacheRead,
					cacheWrite: override.cost.cacheWrite ?? model.cost.cacheWrite,
					tiers: override.cost.tiers ?? model.cost.tiers,
				}
			: model.cost,
		contextWindow: override.contextWindow ?? model.contextWindow,
		maxTokens: override.maxTokens ?? model.maxTokens,
		samplingParams: override.samplingParams
			? mergeUnknownRecords(model.samplingParams, override.samplingParams)
			: model.samplingParams,
		compat: mergeCompat(model.compat, override.compat) as NonNullable<Model<Api>["compat"]>,
	};
}

function modelFromJson(
	providerId: string,
	definition: ModelsJsonModel,
	providerConfig: ModelsJsonProvider,
	defaults: Model<Api> | undefined,
): Model<Api> {
	const api = definition.api ?? providerConfig.api ?? defaults?.api;
	if (!api) {
		throw new Error(
			`Provider ${providerId}, model ${definition.id}: no "api" specified. Set at provider or model level.`,
		);
	}
	const baseUrl = definition.baseUrl ?? providerConfig.baseUrl ?? defaults?.baseUrl;
	if (!baseUrl) throw new Error(`Provider ${providerId}: "baseUrl" is required when defining custom models.`);
	if (definition.contextWindow !== undefined && definition.contextWindow <= 0) {
		throw new Error(`Provider ${providerId}, model ${definition.id}: invalid contextWindow`);
	}
	if (definition.maxTokens !== undefined && definition.maxTokens <= 0) {
		throw new Error(`Provider ${providerId}, model ${definition.id}: invalid maxTokens`);
	}
	const compatValue = mergeCompat(providerConfig.compat, definition.compat);
	const model: Model<Api> = {
		id: definition.id,
		name: definition.name ?? definition.id,
		api: api as Api,
		provider: providerId,
		baseUrl,
		reasoning: definition.reasoning ?? false,
		thinkingLevelMap: definition.thinkingLevelMap,
		input: (definition.input ?? ["text"]) as ("text" | "image")[],
		cost: definition.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow: definition.contextWindow ?? 128000,
		maxTokens: definition.maxTokens ?? 16384,
		samplingParams: definition.samplingParams,
		headers: undefined,
	};
	if (compatValue !== undefined && compatValue !== null) {
		model.compat = compatValue as Model<Api>["compat"];
	}
	return model;
}

function applyModelsJson(
	providerId: string,
	baseModels: readonly Model<Api>[],
	config: ModelsJsonProvider | undefined,
): Model<Api>[] {
	if (!config) return [...baseModels];
	if (config.oauth && !config.baseUrl) {
		throw new Error(`Provider ${providerId}: "baseUrl" is required when "oauth" is set.`);
	}
	const hasOverrides = config.modelOverrides !== undefined && Object.keys(config.modelOverrides).length > 0;
	if (
		!config.models?.length &&
		!config.baseUrl &&
		!config.headers &&
		!config.compat &&
		!hasOverrides &&
		!config.apiKey &&
		!config.oauth &&
		config.authHeader === undefined
	) {
		throw new Error(
			`Provider ${providerId}: must specify "baseUrl", "headers", "compat", "modelOverrides", or "models".`,
		);
	}

	const models: Model<Api>[] = baseModels.map((model) => ({
		...model,
		baseUrl: config.oauth === "radius" ? model.baseUrl : (config.baseUrl ?? model.baseUrl),
		compat: mergeCompat(model.compat, config.compat) as NonNullable<Model<Api>["compat"]>,
	}));
	for (const definition of config.models ?? []) {
		const existingIndex = models.findIndex((model) => model.id === definition.id);
		const defaults = existingIndex >= 0 ? models[existingIndex] : models.length > 0 ? models[0] : undefined;
		const model = modelFromJson(providerId, definition, config, defaults);
		if (existingIndex >= 0) models[existingIndex] = model;
		else models.push(model);
	}
	return models;
}

function applyExtension(
	providerId: string,
	models: readonly Model<Api>[],
	config: ProviderConfigInput | undefined,
): Model<Api>[] {
	if (!config) return [...models];
	if (!config.models) {
		return config.baseUrl ? models.map((model) => ({ ...model, baseUrl: config.baseUrl! })) : [...models];
	}
	return config.models.map((definition) => {
		const matched = models.find((model) => model.id === definition.id);
		const defaults = matched !== undefined ? matched : models.length > 0 ? models[0] : undefined;
		const api = definition.api ?? config.api ?? (defaults !== undefined ? defaults.api : undefined);
		if (!api) {
			throw new Error(
				`Provider ${providerId}, model ${definition.id}: no "api" specified. Set at provider or model level.`,
			);
		}
		const baseUrl = definition.baseUrl ?? config.baseUrl ?? (defaults !== undefined ? defaults.baseUrl : undefined);
		if (!baseUrl) throw new Error(`Provider ${providerId}: "baseUrl" is required when defining custom models.`);
		return {
			...definition,
			api,
			provider: providerId,
			baseUrl,
			headers: undefined,
		};
	});
}

function adaptOAuth(config: ExtensionOAuthConfig): OAuthAuth {
	return {
		name: config.name,
		isSubscription: config.isSubscription,
		login: async (callbacks) => {
			const credential = await config.login({
				onAuth: (info) =>
					callbacks.notify({
						type: "auth_url",
						url: info.url,
						instructions: info.instructions,
					}),
				onDeviceCode: (info) =>
					callbacks.notify({
						type: "device_code",
						userCode: info.userCode,
						verificationUri: info.verificationUri,
						intervalSeconds: info.intervalSeconds,
						expiresInSeconds: info.expiresInSeconds,
					}),
				onPrompt: (prompt) =>
					callbacks.prompt({
						type: "text",
						message: prompt.message,
						placeholder: prompt.placeholder,
					}),
				onProgress: (message) => callbacks.notify({ type: "progress", message }),
				onManualCodeInput: () => callbacks.prompt({ type: "manual_code", message: "Paste the authorization code" }),
				onSelect: async (prompt): Promise<string | undefined> => {
					return await callbacks.prompt({
						type: "select",
						message: prompt.message,
						options: prompt.options,
					});
				},
				signal: callbacks.signal,
			});
			return toOAuthCredential(credential);
		},
		refresh: async (credential, signal) => toOAuthCredential(await config.refreshToken(credential, signal)),
		toAuth: async (credential): Promise<ModelAuth> => ({ apiKey: config.getApiKey(credential) }),
	};
}

function toOAuthCredential(source: OAuthCredentials): OAuthCredential {
	const converted: OAuthCredential = {
		refresh: source.refresh,
		access: source.access,
		expires: source.expires,
		type: "oauth",
	};
	const reserved = ["type", "refresh", "access", "expires"];
	for (const key of Object.keys(source)) {
		if (reserved.includes(key)) continue;
		converted[key] = source[key];
	}
	return converted;
}

function withConfiguredAuth(
	auth: ModelAuth,
	headers: Record<string, string> | undefined,
	authHeader: boolean,
): ModelAuth {
	let mergedHeaders: ProviderHeaders | undefined;
	if (auth.headers || headers) {
		mergedHeaders = {};
		if (auth.headers) {
			for (const key of Object.keys(auth.headers)) {
				const value = auth.headers[key];
				if (value !== null && value !== undefined) mergedHeaders[key] = value;
			}
		}
		if (headers) {
			for (const key of Object.keys(headers)) mergedHeaders[key] = headers[key];
		}
	}
	if (authHeader) {
		if (!auth.apiKey) throw new Error("authHeader requires a resolved API key");
		if (!mergedHeaders) mergedHeaders = {};
		mergedHeaders.Authorization = `Bearer ${auth.apiKey}`;
	}
	return { ...auth, headers: mergedHeaders };
}

function configuredApiKey(
	config: ModelsJsonProvider | undefined,
	extension: ProviderConfigInput | undefined,
): string | undefined {
	return extension?.apiKey ?? config?.apiKey;
}

function configuredHeaders(
	config: ModelsJsonProvider | undefined,
	extension: ProviderConfigInput | undefined,
): Record<string, string> | undefined {
	if (!config?.headers && !extension?.headers) return undefined;
	const merged: Record<string, string> = {};
	if (config?.headers) {
		for (const key of Object.keys(config.headers)) {
			const value = config.headers[key];
			if (value !== null && value !== undefined) merged[key] = value;
		}
	}
	if (extension?.headers) {
		for (const key of Object.keys(extension.headers)) merged[key] = extension.headers[key];
	}
	return merged;
}

async function configContextEnv(
	values: readonly string[],
	ctx: AuthContext,
	explicit?: Record<string, string>,
): Promise<Record<string, string> | undefined> {
	const env: Record<string, string> = {};
	if (explicit) {
		for (const key of Object.keys(explicit)) env[key] = explicit[key];
	}
	const seen = new Set<string>();
	for (const value of values) {
		for (const name of getConfigValueEnvVarNames(value)) {
			if (seen.has(name)) continue;
			seen.add(name);
			if (env[name] !== undefined) continue;
			const resolved = await ctx.env(name);
			if (resolved !== undefined) env[name] = resolved;
		}
	}
	return Object.keys(env).length > 0 ? env : undefined;
}

function composeApiKeyAuth(
	providerId: string,
	base: Provider | undefined,
	config: ModelsJsonProvider | undefined,
	extension: ProviderConfigInput | undefined,
): ApiKeyAuth | undefined {
	const inherited = base?.auth.apiKey;
	const rawKey = configuredApiKey(config, extension);
	const hasOAuth = extension?.oauth !== undefined || base?.auth.oauth !== undefined;
	// OAuth-only providers get no fabricated API-key login method.
	if (!inherited && rawKey === undefined && hasOAuth) return undefined;
	const rawHeaders = configuredHeaders(config, extension);
	let composedLogin: ((interaction: ProviderAuthInteraction) => Promise<ApiKeyCredential>) | undefined;
	if (inherited?.login) {
		const inheritedLogin = inherited.login;
		composedLogin = (interaction: ProviderAuthInteraction) => inheritedLogin(interaction);
	} else {
		composedLogin = async (interaction: ProviderAuthInteraction) => {
			const key = await interaction.prompt({ type: "secret", message: "Enter API key" });
			const credential: ApiKeyCredential = { type: "api_key", key };
			return credential;
		};
	}
	const authHeader = extension?.authHeader ?? config?.authHeader ?? false;
	return {
		name: inherited?.name ?? "API key",
		login: composedLogin,
		check: async (input) => {
			const inheritedCheck = inherited?.check;
			if (input.credential) {
				if (inheritedCheck) return inheritedCheck(input);
				if (input.credential.key) return { type: "api_key", source: "stored credential" };
				const inheritedResolveForCheck = inherited?.resolve;
				const resolved = inheritedResolveForCheck ? await inheritedResolveForCheck(input) : undefined;
				return resolved ? { type: "api_key", source: resolved.source } : undefined;
			}
			if (rawKey !== undefined) {
				if (isCommandConfigValue(rawKey)) return { type: "api_key", source: "configured API key" };
				const envNames = getConfigValueEnvVarNames(rawKey);
				for (const name of envNames) {
					if ((await input.ctx.env(name)) === undefined) return undefined;
				}
				return { type: "api_key", source: "configured API key" };
			}
			if (inheritedCheck) return inheritedCheck(input);
			const inheritedResolve = inherited?.resolve;
			const resolved = inheritedResolve ? await inheritedResolve(input) : undefined;
			return resolved ? { type: "api_key", source: resolved.source } : undefined;
		},
		resolve: async (input) => {
			let result: AuthResult | undefined;
			if (input.credential) {
				result = inherited
					? await inherited.resolve(input)
					: input.credential.key
						? { auth: { apiKey: input.credential.key }, env: input.credential.env, source: "stored credential" }
						: undefined;
			} else if (rawKey !== undefined) {
				const env = await configContextEnv([rawKey], input.ctx);
				const key = resolveConfigValueOrThrow(rawKey, `API key for provider "${providerId}"`, env);
				result = inherited
					? await inherited.resolve({ ...input, credential: { type: "api_key", key } })
					: { auth: { apiKey: key }, source: "configured API key" };
			} else {
				const inheritedResolve = inherited?.resolve;
				result = inheritedResolve ? await inheritedResolve(input) : undefined;
			}
			if (!result) return undefined;
			const credentialEnv = input.credential?.env;
			const explicitEnv = mergeStringRecords(
				credentialEnv as Record<string, string> | undefined,
				result.env as Record<string, string> | undefined,
			);
			const headerValues: string[] = [];
			if (rawHeaders) {
				for (const headerKey of Object.keys(rawHeaders)) {
					const headerValue = rawHeaders[headerKey];
					if (headerValue !== null && headerValue !== undefined) headerValues.push(headerValue);
				}
			}
			const headerEnv = await configContextEnv(headerValues, input.ctx, explicitEnv);
			const headers = resolveHeadersOrThrow(rawHeaders, `provider "${providerId}"`, headerEnv);
			return { ...result, auth: withConfiguredAuth(result.auth, headers, authHeader) };
		},
	};
}

function composeOAuthAuth(
	providerId: string,
	base: Provider | undefined,
	config: ModelsJsonProvider | undefined,
	extension: ProviderConfigInput | undefined,
): OAuthAuth | undefined {
	const oauth = extension?.oauth ? adaptOAuth(extension.oauth) : base?.auth.oauth;
	if (!oauth) return undefined;
	const rawHeaders = configuredHeaders(config, extension);
	const authHeader = extension?.authHeader ?? config?.authHeader ?? false;
	return {
		...oauth,
		toAuth: async (credential) => {
			const auth = await oauth.toAuth(credential);
			const env = credential.env;
			const headers = resolveHeadersOrThrow(
				rawHeaders,
				`provider "${providerId}"`,
				typeof env === "object" && env !== null ? (env as Record<string, string>) : undefined,
			);
			return withConfiguredAuth(auth, headers, authHeader);
		},
	};
}

function rawModelHeaders(
	model: Model<Api>,
	config: ModelsJsonProvider | undefined,
	extension: ProviderConfigInput | undefined,
): Record<string, string> | undefined {
	const definition = config?.models?.find((entry) => entry.id === model.id);
	const extensionModel = extension?.models?.find((entry) => entry.id === model.id);
	const modelOverrides = config?.modelOverrides;
	const overrideHeaders = modelOverrides !== undefined ? modelOverrides[model.id]?.headers : undefined;
	const headers: Record<string, string> = {};
	if (overrideHeaders) {
		for (const key of Object.keys(overrideHeaders)) headers[key] = overrideHeaders[key];
	}
	if (definition?.headers) {
		for (const key of Object.keys(definition.headers)) headers[key] = definition.headers[key];
	}
	if (extensionModel?.headers) {
		for (const key of Object.keys(extensionModel.headers)) headers[key] = extensionModel.headers[key];
	}
	return Object.keys(headers).length > 0 ? headers : undefined;
}

export function validateExtensionProvider(
	providerId: string,
	base: Provider | undefined,
	modelsConfig: ModelsJsonProvider | undefined,
	extension: ProviderConfigInput,
): void {
	if (extension.streamSimple && !extension.api) {
		throw new Error(`Provider ${providerId}: "api" is required when registering streamSimple.`);
	}
	applyExtension(providerId, applyModelsJson(providerId, base?.getModels() ?? [], modelsConfig), extension);
}

/** Compose built-in, models.json, and extension layers without reading credentials. */
export function composeModelProvider(
	providerId: string,
	base: Provider | undefined,
	modelConfig: ModelConfig,
	extension: ProviderConfigInput | undefined,
): Provider {
	const config = modelConfig.getProvider(providerId);
	const currentExtension = (): ProviderConfigInput | undefined => extension;
	// models.json modelOverrides are the topmost user-config layer: they apply once,
	// after custom-model upserts, extension model replacement, and legacy OAuth projection.
	const getModels = () => {
		const models = applyExtension(
			providerId,
			applyModelsJson(providerId, base?.getModels() ?? [], config),
			currentExtension(),
		);
		return models.map((model) => {
			const override = config?.modelOverrides?.[model.id];
			return override ? applyModelOverride(model, override) : model;
		});
	};
	// Validate eagerly so registration/reload reports structural errors immediately.
	getModels();
	const apiKey = composeApiKeyAuth(providerId, base, config, extension);
	const oauth = composeOAuthAuth(providerId, base, config, extension);
	if (!apiKey && !oauth) throw new Error(`Provider ${providerId}: no authentication method configured.`);

	const supportsBaseApi = (model: Model<Api>) => base?.getModels().some((entry) => entry.api === model.api) ?? false;
	const streamWith = (
		model: Model<Api>,
		context: Context,
		options: StreamOptions | undefined,
		simple: boolean,
	): AssistantMessageEventStream =>
		lazyStream(model, async () => {
			if (extension !== undefined) {
				const extensionStreamSimple = extension.streamSimple;
				if (extensionStreamSimple !== undefined && model.api === extension.api) {
					return extensionStreamSimple(model, context, options as unknown as SimpleStreamOptions);
				}
			}
			if (base && supportsBaseApi(model)) {
				if (simple) {
					return base.streamSimple(model, context, options as unknown as SimpleStreamOptions);
				}
				return base.stream(model, context, options);
			}
			const api = getApiProvider(model.api);
			if (!api) throw new Error(`No API provider registered for api: ${model.api}`);
			return simple
				? api.streamSimple(model, context, options as SimpleStreamOptions)
				: api.stream(model, context, options);
		});

	const provider: Provider = {
		id: providerId,
		name: extension?.name ?? config?.name ?? base?.name ?? extension?.oauth?.name ?? providerId,
		baseUrl: extension?.baseUrl ?? config?.baseUrl ?? base?.baseUrl,
		headers: base?.headers,
		auth: { ...(apiKey ? { apiKey } : {}), ...(oauth ? { oauth } : {}) },
		getModels,
		filterModels: base?.filterModels
			? (models, credential: Credential | undefined) => base.filterModels!(models, credential)
			: undefined,
		stream: (model, context, options) => streamWith(model, context, options, false),
		streamSimple: (model, context, options) => streamWith(model, context, options, true),
	};

	const fetchDeferred = base?.fetchDeferred;
	if (fetchDeferred) {
		provider.fetchDeferred = (model, handle, options) => fetchDeferred(model, handle, options);
	}
	const cancelDeferred = base?.cancelDeferred;
	if (cancelDeferred) {
		provider.cancelDeferred = (model, handle, options) => cancelDeferred(model, handle, options);
	}

	return provider;
}

export function resolveConfiguredModelHeaders(
	model: Model<Api>,
	config: ModelsJsonProvider | undefined,
	extension: ProviderConfigInput | undefined,
	env?: Record<string, string>,
): Record<string, string> | undefined {
	return resolveHeadersOrThrow(
		rawModelHeaders(model, config, extension),
		`model "${model.provider}/${model.id}"`,
		env,
	);
}

export interface CompatibilityRequestConfig {
	headers?: ProviderHeaders;
	authHeader: boolean;
}

export function resolveCompatibilityRequestConfig(
	model: Model<Api>,
	config: ModelsJsonProvider | undefined,
	extension: ProviderConfigInput | undefined,
): CompatibilityRequestConfig {
	const configured = resolveHeadersOrThrow(
		{ ...configuredHeaders(config, extension), ...rawModelHeaders(model, config, extension) },
		`model "${model.provider}/${model.id}"`,
	);
	return {
		headers: model.headers || configured ? { ...model.headers, ...configured } : undefined,
		authHeader: extension?.authHeader ?? config?.authHeader ?? false,
	};
}

export function configuredRequestAuthStatus(
	config: ModelsJsonProvider | undefined,
	extension: ProviderConfigInput | undefined,
): AuthStatus | undefined {
	const value = configuredApiKey(config, extension);
	if (value === undefined) return undefined;
	if (isCommandConfigValue(value)) return { configured: true, source: "models_json_command" };
	const names = getConfigValueEnvVarNames(value);
	if (names.length > 0) {
		return isConfigValueConfigured(value)
			? { configured: true, source: "environment", label: names.join(", ") }
			: { configured: false };
	}
	return { configured: true, source: extension?.apiKey !== undefined ? "fallback" : "models_json_key" };
}
