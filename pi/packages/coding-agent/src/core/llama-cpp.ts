/**
 * Built-in llama.cpp server provider: login, catalog discovery, and model
 * metadata synthesis. The provider speaks the OpenAI-compatible API at
 * `<server>/v1` and reads everything else from the llama.cpp router surface:
 * the `/models` catalog, and the chat-template probes that decide whether a
 * model toggles thinking through `chat_template_kwargs.enable_thinking` and
 * accepts `reasoning_effort`. Thinking levels pass through unmapped: pi's
 * ladder names (minimal to max) are exactly llama.cpp's documented effort
 * enum, and `off` maps to the disabled toggle.
 */

import { getApiProvider } from "../../../ai/src/compat.ts";
import type {
	Api,
	ApiKeyAuth,
	ApiKeyCredential,
	AssistantMessageEventStream,
	AuthCheck,
	AuthContext,
	AuthResult,
	Context,
	Model,
	ModelAuth,
	Provider,
	ProviderAuthInteraction,
	SimpleStreamOptions,
	StreamOptions,
} from "../../../ai/src/index.ts";
import { setThinkingLevelMapOverride } from "../../../ai/src/models.ts";
import { detectChatTemplateThinking, probeThinkingLevels } from "./chat-template-thinking.ts";
import { type LlamaRouterModel, type LlamaRouterServer, listLlamaModels, llamaRouterRoot } from "./llama-router.ts";

/** Provider id shared with upstream pi so sessions and configs stay comparable. */
export const LLAMA_CPP_PROVIDER_ID = "llama.cpp";

const DEFAULT_LLAMA_SERVER_URL = "http://127.0.0.1:8080";
const LLAMA_BASE_URL_ENV = "LLAMA_BASE_URL";
const LLAMA_API_KEY_ENV = "LLAMA_API_KEY";
const DEFAULT_CONTEXT_WINDOW = 128_000;
const DISCOVERY_TIMEOUT_MS = 5_000;

/** One configured llama.cpp server: the router root plus an optional bearer key. */
export interface LlamaCppServer {
	baseUrl: string;
	apiKey: string | undefined;
}

/** Catalog entry with the metadata the server reports for one model. */
export interface LlamaCppCatalogModel {
	id: string;
	reasoning: boolean;
	effort: boolean;
	contextWindow: number;
	input: ("text" | "image")[];
}

/** Mutable-catalog controller behind the built-in provider. */
export interface LlamaCppProviderController {
	provider: Provider;
	setCatalog(models: readonly LlamaCppCatalogModel[], server: LlamaCppServer): void;
	getServer(): LlamaCppServer | undefined;
}

function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

function lookupString(value: unknown, key: string): string | undefined {
	if (value === null || typeof value !== "object") return undefined;
	const found = recordViewOf(value)[key];
	return typeof found === "string" ? found : undefined;
}

function routerServerOf(server: LlamaCppServer): LlamaRouterServer {
	return { id: LLAMA_CPP_PROVIDER_ID, name: "llama.cpp", baseUrl: server.baseUrl, apiKey: server.apiKey };
}

/** Root URL of the server without trailing slashes or a /v1 suffix. */
export function normalizeLlamaServerUrl(value: string): string {
	return llamaRouterRoot(value);
}

/** OpenAI-compatible inference base for a normalized server root. */
export function llamaInferenceUrl(serverRoot: string): string {
	return `${serverRoot}/v1`;
}

function serverFromParts(baseUrl: string | undefined, apiKey: string | undefined): LlamaCppServer | undefined {
	if (baseUrl === undefined) return undefined;
	const root = normalizeLlamaServerUrl(baseUrl);
	if (root.length === 0) return undefined;
	const key = apiKey !== undefined && apiKey.length > 0 ? apiKey : undefined;
	return { baseUrl: root, apiKey: key };
}

async function lookupEnv(ctx: AuthContext, name: string): Promise<string | undefined> {
	const value = await ctx.env(name);
	if (value === undefined) return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

/** Server configuration from a stored credential plus ambient environment. */
export async function llamaCppServerFromCredential(
	credential: ApiKeyCredential | undefined,
	ctx: AuthContext,
): Promise<LlamaCppServer | undefined> {
	const env = credential?.env;
	const fromEnv = env === undefined || env === null ? undefined : lookupString(recordViewOf(env), LLAMA_BASE_URL_ENV);
	const baseUrl = fromEnv ?? (await lookupEnv(ctx, LLAMA_BASE_URL_ENV));
	const key = credential?.key ?? (await lookupEnv(ctx, LLAMA_API_KEY_ENV));
	return serverFromParts(baseUrl, key);
}

function catalogInputOf(model: LlamaCppCatalogModel): ("text" | "image")[] {
	const input: ("text" | "image")[] = ["text"];
	if (model.input.indexOf("image") !== -1) input.push("image");
	return input;
}

/**
 * Build one provider model. Optional keys are materialized explicitly and the
 * compat record stays a dynamic record cast into its union: under the static
 * runtime an absent key reads as a trap rather than undefined, and typed union
 * reads drop single-arm fields.
 */
function toModel(model: LlamaCppCatalogModel, server: LlamaCppServer): Model<Api> {
	const contextWindow = model.contextWindow > 0 ? model.contextWindow : DEFAULT_CONTEXT_WINDOW;
	const compatRecord: unknown = {
		supportsStore: false,
		supportsDeveloperRole: false,
		supportsReasoningEffort: model.effort,
		supportsUsageInStreaming: true,
		supportsStrictMode: false,
		maxTokensField: "max_tokens",
	};
	const built: Model<Api> = {
		id: model.id,
		name: model.id,
		api: "openai-completions",
		provider: LLAMA_CPP_PROVIDER_ID,
		baseUrl: llamaInferenceUrl(server.baseUrl),
		reasoning: model.reasoning,
		thinkingLevelMap: undefined,
		input: catalogInputOf(model),
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		promptCache: undefined,
		contextWindow,
		maxTokens: contextWindow,
		samplingParams: undefined,
		headers: undefined,
	};
	built.compat = compatRecord as Model<Api>["compat"];
	return built;
}
function readCatalogMetadata(entry: LlamaRouterModel): {
	contextWindow: number;
	input: ("text" | "image")[];
} {
	const input: ("text" | "image")[] = [];
	if (entry.image === true) input.push("image");
	const contextWindow =
		entry.context !== undefined && entry.context > 0
			? entry.context
			: entry.contextTrain !== undefined && entry.contextTrain > 0
				? entry.contextTrain
				: DEFAULT_CONTEXT_WINDOW;
	return { contextWindow, input };
}

/**
 * Read the server's model catalog and classify each model's thinking support.
 * Only loaded models are probed for chat templates: querying unloaded presets
 * could load them and querying sleeping instances could wake them. Unprobed
 * models stay unclassified until a later discovery sees them loaded. For a
 * model whose template also takes reasoning_effort, the thinking levels it
 * accepts are probed once and recorded as its thinkingLevelMap.
 */
export async function discoverLlamaCppCatalog(
	server: LlamaCppServer,
	signal: AbortSignal,
): Promise<LlamaCppCatalogModel[]> {
	const discoverySignal = AbortSignal.any([signal, AbortSignal.timeout(DISCOVERY_TIMEOUT_MS)]);
	const entries = await listLlamaModels(routerServerOf(server), discoverySignal);
	const loadedIds: string[] = [];
	for (const entry of entries) {
		if (entry.status === "loaded") loadedIds.push(entry.id);
	}
	const detections = await detectChatTemplateThinking(
		[{ providerId: LLAMA_CPP_PROVIDER_ID, baseUrl: server.baseUrl, apiKey: server.apiKey, modelIds: loadedIds }],
		discoverySignal,
	);
	const thinkingIds: string[] = [];
	const effortIds: string[] = [];
	for (const detection of detections) {
		for (const modelId of detection.modelIds) thinkingIds.push(modelId);
		for (const modelId of detection.effortModelIds) effortIds.push(modelId);
	}
	const models: LlamaCppCatalogModel[] = [];
	for (const entry of entries) {
		const metadata = readCatalogMetadata(entry);
		models.push({
			id: entry.id,
			reasoning: thinkingIds.indexOf(entry.id) !== -1,
			effort: effortIds.indexOf(entry.id) !== -1,
			contextWindow: metadata.contextWindow,
			input: metadata.input,
		});
	}
	const effortModelIds: string[] = [];
	for (const model of models) {
		if (model.effort === true) effortModelIds.push(model.id);
	}
	let effortIndex = 0;
	while (effortIndex < effortModelIds.length) {
		const modelId = effortModelIds[effortIndex];
		effortIndex++;
		const levelMap = await probeThinkingLevels(server.baseUrl, server.apiKey, modelId, discoverySignal);
		if (levelMap !== undefined) setThinkingLevelMapOverride(LLAMA_CPP_PROVIDER_ID, modelId, levelMap);
	}
	return models;
}

/**
 * Build the built-in provider. The model list is a closure so a catalog
 * refresh replaces it in place; auth follows the official llama.cpp provider:
 * the login flow prompts for the server URL and an optional API key, stores
 * the URL in the credential env, and validates against the server before
 * committing.
 */
export function createLlamaCppProvider(): LlamaCppProviderController {
	let catalog: Model<Api>[] = [];
	let server: LlamaCppServer | undefined;

	const resolveServer = async (
		ctx: AuthContext,
		credential: ApiKeyCredential | undefined,
	): Promise<LlamaCppServer | undefined> => {
		const resolved = await llamaCppServerFromCredential(credential, ctx);
		if (resolved !== undefined) server = resolved;
		return resolved ?? server;
	};

	const apiKeyAuth: ApiKeyAuth = {
		name: "llama.cpp server",
		login: async (interaction: ProviderAuthInteraction): Promise<ApiKeyCredential> => {
			const enteredUrl = await interaction.prompt({
				type: "text",
				message: "llama.cpp server URL",
				placeholder: DEFAULT_LLAMA_SERVER_URL,
			});
			const ambientUrl = process.env.LLAMA_BASE_URL;
			const serverUrl = normalizeLlamaServerUrl(enteredUrl.trim() || ambientUrl || DEFAULT_LLAMA_SERVER_URL);
			const enteredKey = (
				await interaction.prompt({
					type: "secret",
					message: "API key (optional)",
				})
			).trim();
			const candidate = serverFromParts(serverUrl, enteredKey);
			if (candidate === undefined) throw new Error("llama.cpp server URL is empty");
			await listLlamaModels(routerServerOf(candidate), AbortSignal.timeout(DISCOVERY_TIMEOUT_MS));
			return {
				type: "api_key",
				key: enteredKey.length > 0 ? enteredKey : undefined,
				env: { LLAMA_BASE_URL: candidate.baseUrl },
			};
		},
		check: async (input: {
			ctx: AuthContext;
			credential?: ApiKeyCredential;
			signal: AbortSignal;
		}): Promise<AuthCheck | undefined> => {
			const resolved = await resolveServer(input.ctx, input.credential);
			return resolved
				? { type: "api_key", source: input.credential ? "stored credential" : LLAMA_BASE_URL_ENV }
				: undefined;
		},
		resolve: async (input: {
			ctx: AuthContext;
			credential?: ApiKeyCredential;
			signal: AbortSignal;
		}): Promise<AuthResult | undefined> => {
			const resolved = await resolveServer(input.ctx, input.credential);

			if (resolved === undefined) return undefined;
			const env: Record<string, string> = { LLAMA_BASE_URL: resolved.baseUrl };
			const credentialEnv = input.credential?.env;
			if (credentialEnv !== undefined && credentialEnv !== null) {
				const view = recordViewOf(credentialEnv);
				for (const key of Object.keys(view)) {
					const value = view[key];
					if (typeof value === "string") env[key] = value;
				}
			}
			const modelAuth: ModelAuth = {
				apiKey: resolved.apiKey ?? "local",
				baseUrl: llamaInferenceUrl(resolved.baseUrl),
				headers: undefined,
			};
			const source = input.credential ? "stored credential" : LLAMA_BASE_URL_ENV;

			const result: AuthResult = { auth: modelAuth, env, source };

			return result;
		},
	};

	const provider: Provider = {
		id: LLAMA_CPP_PROVIDER_ID,
		name: "llama.cpp",
		baseUrl: llamaInferenceUrl(DEFAULT_LLAMA_SERVER_URL),
		auth: { apiKey: apiKeyAuth },
		getModels: (): readonly Model<Api>[] => catalog,
		stream: (model: Model<Api>, context: Context, options?: StreamOptions): AssistantMessageEventStream =>
			openaiStreams().stream(model, context, options),
		streamSimple: (model: Model<Api>, context: Context, options?: SimpleStreamOptions): AssistantMessageEventStream =>
			openaiStreams().streamSimple(model, context, options),
	};

	const openaiStreams = (): NonNullable<ReturnType<typeof getApiProvider>> => {
		const streams = getApiProvider("openai-completions");
		if (streams === undefined) throw new Error('No API provider registered for api: "openai-completions"');
		return streams;
	};

	return {
		provider,
		setCatalog: (models: readonly LlamaCppCatalogModel[], next: LlamaCppServer): void => {
			server = next;
			const rebuilt: Model<Api>[] = [];
			for (const model of models) rebuilt.push(toModel(model, next));
			catalog = rebuilt;
		},
		getServer: (): LlamaCppServer | undefined => server,
	};
}
