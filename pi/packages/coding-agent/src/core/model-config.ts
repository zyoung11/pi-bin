/** Immutable, credential-blind models.json snapshot. */

import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, join } from "path";
import { type Static, Compile, Type, type PiValidationError } from "../../../ai/src/schema.ts";
import { stripJsonComments } from "../utils/json.ts";
import { normalizePath } from "../utils/paths.ts";
import { stripBom } from "../utils/text.ts";

const PercentileCutoffsSchema = Type.Object({
	p50: Type.Optional(Type.Number()),
	p75: Type.Optional(Type.Number()),
	p90: Type.Optional(Type.Number()),
	p99: Type.Optional(Type.Number()),
});

const OpenRouterRoutingSchema = Type.Object({
	allow_fallbacks: Type.Optional(Type.Boolean()),
	require_parameters: Type.Optional(Type.Boolean()),
	data_collection: Type.Optional(Type.Union([Type.Literal("deny"), Type.Literal("allow")])),
	zdr: Type.Optional(Type.Boolean()),
	enforce_distillable_text: Type.Optional(Type.Boolean()),
	order: Type.Optional(Type.Array(Type.String())),
	only: Type.Optional(Type.Array(Type.String())),
	ignore: Type.Optional(Type.Array(Type.String())),
	quantizations: Type.Optional(Type.Array(Type.String())),
	sort: Type.Optional(
		Type.Union([
			Type.String(),
			Type.Object({
				by: Type.Optional(Type.String()),
				partition: Type.Optional(Type.Union([Type.String(), Type.Null()])),
			}),
		]),
	),
	max_price: Type.Optional(
		Type.Object({
			prompt: Type.Optional(Type.Union([Type.Number(), Type.String()])),
			completion: Type.Optional(Type.Union([Type.Number(), Type.String()])),
			image: Type.Optional(Type.Union([Type.Number(), Type.String()])),
			audio: Type.Optional(Type.Union([Type.Number(), Type.String()])),
			request: Type.Optional(Type.Union([Type.Number(), Type.String()])),
		}),
	),
	preferred_min_throughput: Type.Optional(Type.Union([Type.Number(), PercentileCutoffsSchema])),
	preferred_max_latency: Type.Optional(Type.Union([Type.Number(), PercentileCutoffsSchema])),
});

const VercelGatewayRoutingSchema = Type.Object({
	only: Type.Optional(Type.Array(Type.String())),
	order: Type.Optional(Type.Array(Type.String())),
});

const ThinkingLevelMapValueSchema = Type.Union([Type.String(), Type.Null()]);
const ThinkingLevelMapSchema = Type.Object({
	off: Type.Optional(ThinkingLevelMapValueSchema),
	minimal: Type.Optional(ThinkingLevelMapValueSchema),
	low: Type.Optional(ThinkingLevelMapValueSchema),
	medium: Type.Optional(ThinkingLevelMapValueSchema),
	high: Type.Optional(ThinkingLevelMapValueSchema),
	xhigh: Type.Optional(ThinkingLevelMapValueSchema),
	max: Type.Optional(ThinkingLevelMapValueSchema),
});

const ChatTemplateKwargScalarSchema = Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]);
const ChatTemplateKwargVariableSchema = Type.Object({
	$var: Type.Union([Type.Literal("thinking.enabled"), Type.Literal("thinking.effort")]),
	omitWhenOff: Type.Optional(Type.Boolean()),
});
const ChatTemplateKwargSchema = Type.Union([ChatTemplateKwargScalarSchema, ChatTemplateKwargVariableSchema]);

const OpenAICompletionsCompatSchema = Type.Object({
	supportsStore: Type.Optional(Type.Boolean()),
	supportsDeveloperRole: Type.Optional(Type.Boolean()),
	supportsReasoningEffort: Type.Optional(Type.Boolean()),
	supportsUsageInStreaming: Type.Optional(Type.Boolean()),
	supportsFinishReason: Type.Optional(Type.Boolean()),
	maxTokensField: Type.Optional(Type.Union([Type.Literal("max_completion_tokens"), Type.Literal("max_tokens")])),
	requiresToolResultName: Type.Optional(Type.Boolean()),
	requiresAssistantAfterToolResult: Type.Optional(Type.Boolean()),
	requiresThinkingAsText: Type.Optional(Type.Boolean()),
	requiresReasoningContentOnAssistantMessages: Type.Optional(Type.Boolean()),
	thinkingFormat: Type.Optional(
		Type.Union([
			Type.Literal("openai"),
			Type.Literal("openrouter"),
			Type.Literal("together"),
			Type.Literal("baseten"),
			Type.Literal("deepseek"),
			Type.Literal("zai"),
			Type.Literal("qwen"),
			Type.Literal("chat-template"),
			Type.Literal("qwen-chat-template"),
			Type.Literal("string-thinking"),
			Type.Literal("ant-ling"),
		]),
	),
	chatTemplateKwargs: Type.Optional(Type.Record(Type.String(), ChatTemplateKwargSchema)),
	chatTemplateArgs: Type.Optional(Type.Record(Type.String(), ChatTemplateKwargSchema)),
	cacheControlFormat: Type.Optional(Type.Literal("anthropic")),
	openRouterRouting: Type.Optional(OpenRouterRoutingSchema),
	vercelGatewayRouting: Type.Optional(VercelGatewayRoutingSchema),
	supportsOpenAIGrammarTools: Type.Optional(Type.Boolean()),
	supportsStrictMode: Type.Optional(Type.Boolean()),
	sendSessionAffinityHeaders: Type.Optional(Type.Boolean()),
	deferredToolsMode: Type.Optional(Type.Literal("kimi")),
	sessionAffinityFormat: Type.Optional(
		Type.Union([Type.Literal("openai"), Type.Literal("openai-nosession"), Type.Literal("openrouter")]),
	),
	supportsLongCacheRetention: Type.Optional(Type.Boolean()),
});

const OpenAIResponsesCompatSchema = Type.Object({
	supportsDeveloperRole: Type.Optional(Type.Boolean()),
	sessionAffinityFormat: Type.Optional(
		Type.Union([Type.Literal("openai"), Type.Literal("openai-nosession"), Type.Literal("openrouter")]),
	),
	supportsLongCacheRetention: Type.Optional(Type.Boolean()),
	supportsStrictMode: Type.Optional(Type.Boolean()),
	supportsOpenAIGrammarTools: Type.Optional(Type.Boolean()),
	supportsAdditionalTools: Type.Optional(Type.Boolean()),
	supportsToolSearch: Type.Optional(Type.Boolean()),
});

const AnthropicMessagesCompatSchema = Type.Object({
	supportsEagerToolInputStreaming: Type.Optional(Type.Boolean()),
	supportsLongCacheRetention: Type.Optional(Type.Boolean()),
	sendSessionAffinityHeaders: Type.Optional(Type.Boolean()),
	supportsCacheControlOnTools: Type.Optional(Type.Boolean()),
	supportsTemperature: Type.Optional(Type.Boolean()),
	forceAdaptiveThinking: Type.Optional(Type.Boolean()),
	allowEmptySignature: Type.Optional(Type.Boolean()),
	supportsStrictTools: Type.Optional(Type.Boolean()),
	supportsToolReferences: Type.Optional(Type.Boolean()),
});

const ProviderCompatSchema = Type.Union([
	OpenAICompletionsCompatSchema,
	OpenAIResponsesCompatSchema,
	AnthropicMessagesCompatSchema,
]);

const ModelCostRatesSchema = {
	input: Type.Number(),
	output: Type.Number(),
	cacheRead: Type.Number(),
	cacheWrite: Type.Number(),
};
const ModelCostTierSchema = Type.Object({
	...ModelCostRatesSchema,
	inputTokensAbove: Type.Number(),
});
const ModelCostSchema = Type.Object({
	...ModelCostRatesSchema,
	tiers: Type.Optional(Type.Array(ModelCostTierSchema)),
});

const ModelDefinitionSchema = Type.Object({
	id: Type.String({ minLength: 1 }),
	name: Type.Optional(Type.String({ minLength: 1 })),
	api: Type.Optional(Type.String({ minLength: 1 })),
	baseUrl: Type.Optional(Type.String({ minLength: 1 })),
	reasoning: Type.Optional(Type.Boolean()),
	thinkingLevelMap: Type.Optional(ThinkingLevelMapSchema),
	input: Type.Optional(Type.Array(Type.Union([Type.Literal("text"), Type.Literal("image")]))),
	cost: Type.Optional(ModelCostSchema),
	contextWindow: Type.Optional(Type.Number()),
	maxTokens: Type.Optional(Type.Number()),
	samplingParams: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
	headers: Type.Optional(Type.Record(Type.String(), Type.String())),
	compat: Type.Optional(ProviderCompatSchema),
});

const ModelOverrideSchema = Type.Object({
	name: Type.Optional(Type.String({ minLength: 1 })),
	reasoning: Type.Optional(Type.Boolean()),
	thinkingLevelMap: Type.Optional(ThinkingLevelMapSchema),
	input: Type.Optional(Type.Array(Type.Union([Type.Literal("text"), Type.Literal("image")]))),
	cost: Type.Optional(
		Type.Object({
			input: Type.Optional(Type.Number()),
			output: Type.Optional(Type.Number()),
			cacheRead: Type.Optional(Type.Number()),
			cacheWrite: Type.Optional(Type.Number()),
			tiers: Type.Optional(Type.Array(ModelCostTierSchema)),
		}),
	),
	contextWindow: Type.Optional(Type.Number()),
	maxTokens: Type.Optional(Type.Number()),
	samplingParams: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
	headers: Type.Optional(Type.Record(Type.String(), Type.String())),
	compat: Type.Optional(ProviderCompatSchema),
});

const ProviderConfigSchema = Type.Object({
	name: Type.Optional(Type.String({ minLength: 1 })),
	baseUrl: Type.Optional(Type.String({ minLength: 1 })),
	apiKey: Type.Optional(Type.String({ minLength: 1 })),
	api: Type.Optional(Type.String({ minLength: 1 })),
	oauth: Type.Optional(Type.Literal("radius")),
	headers: Type.Optional(Type.Record(Type.String(), Type.String())),
	compat: Type.Optional(ProviderCompatSchema),
	authHeader: Type.Optional(Type.Boolean()),
	models: Type.Optional(Type.Array(ModelDefinitionSchema)),
	modelOverrides: Type.Optional(Type.Record(Type.String(), ModelOverrideSchema)),
});

const ModelsConfigSchema = Type.Object({
	providers: Type.Record(Type.String(), ProviderConfigSchema),
});
const validateModelsConfig = Compile(ModelsConfigSchema);

export type ModelsJsonModel = Static<typeof ModelDefinitionSchema>;
export type ModelsJsonModelOverride = Static<typeof ModelOverrideSchema>;
export type ModelsJsonProvider = Static<typeof ProviderConfigSchema>;
type ModelsJson = Static<typeof ModelsConfigSchema>;

function formatValidationPath(error: PiValidationError): string {
	if (error.keyword === "required") {
		const requiredProperties = (error.params as { requiredProperties?: string[] }).requiredProperties;
		const requiredProperty = requiredProperties !== undefined && requiredProperties.length > 0 ? requiredProperties[0] : undefined;
		if (requiredProperty) {
			const basePath = error.instancePath.replace(/^\//, "").replace(/\//g, ".");
			return basePath ? `${basePath}.${requiredProperty}` : requiredProperty;
		}
	}
	const path = error.instancePath.replace(/^\//, "").replace(/\//g, ".");
	return path || "root";
}

function deepFreeze<T>(value: T): T {
	return value;
}

function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

interface ModelsStoreEntry {
	id?: unknown;
	name?: unknown;
	api?: unknown;
	baseUrl?: unknown;
	reasoning?: unknown;
	input?: unknown;
	contextWindow?: unknown;
	maxTokens?: unknown;
	cost?: unknown;
	compat?: unknown;
	thinkingLevelMap?: unknown;
}

/**
 * Rebuild provider definitions from the upstream models-store.json catalog cache
 * (written by the original pi for built-in API providers) merged in memory with
 * the user's models.json. Nothing is written back to disk; credentials resolve
 * from auth.json by matching provider id at request time. Each synthesized
 * provider must pass the models.json schema check or it is skipped.
 */
function synthesizeProvidersFromModelsStore(
	modelsStorePath: string,
	existingProviderIds: readonly string[],
): { providers: Map<string, ModelsJsonProvider>; error: string | undefined } {
	let content: string;
	try {
		content = readFileSync(modelsStorePath, "utf-8");
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return { providers: new Map(), error: undefined };
		}
		return {
			providers: new Map(),
			error: `Failed to load models-store.json: ${error instanceof Error ? error.message : error}\n\nFile: ${modelsStorePath}`,
		};
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(stripBom(content));
	} catch (error) {
		return {
			providers: new Map(),
			error: `Failed to parse models-store.json: ${error instanceof Error ? error.message : error}\n\nFile: ${modelsStorePath}`,
		};
	}
	if (parsed === null || typeof parsed !== "object") {
		return { providers: new Map(), error: undefined };
	}

	const storeView = recordViewOf(parsed);
	const providers = new Map<string, ModelsJsonProvider>();
	for (const providerId of Object.keys(storeView)) {
		if (existingProviderIds.indexOf(providerId) !== -1) continue;
		const block = recordViewOf(storeView[providerId]);
		const rawModels = block["models"];
		if (!Array.isArray(rawModels)) continue;
		const entries = rawModels as Record<string, unknown>[];
		if (entries.length === 0) continue;

		const first = entries[0];
		if (first === undefined) continue;
		const api = first["api"];
		if (api !== "openai-completions") continue;

		const baseUrls: string[] = [];
		for (const entry of entries) {
			const url = entry["baseUrl"];
			if (typeof url === "string" && baseUrls.indexOf(url) === -1) baseUrls.push(url);
		}
		if (baseUrls.length !== 1) continue;

		const models: Record<string, unknown>[] = [];
		for (const entry of entries) {
			const id = entry["id"];
			const contextWindow = entry["contextWindow"];
			if (typeof id !== "string" || typeof contextWindow !== "number") continue;
			const cost = entry["cost"];
			const model: Record<string, unknown> = {
				id,
				name: typeof entry["name"] === "string" ? entry["name"] : id,
				reasoning: entry["reasoning"] === true,
				input: Array.isArray(entry["input"]) ? entry["input"] : ["text"],
				contextWindow,
				cost:
					cost !== null && typeof cost === "object"
						? cost
						: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
			};
			const maxTokens = entry["maxTokens"];
			if (typeof maxTokens === "number") model["maxTokens"] = maxTokens;
			const compat = entry["compat"];
			if (compat !== null && typeof compat === "object") model["compat"] = compat;
			const thinkingLevelMap = entry["thinkingLevelMap"];
			if (thinkingLevelMap !== null && typeof thinkingLevelMap === "object") {
				model["thinkingLevelMap"] = thinkingLevelMap;
			}
			models.push(model);
		}
		if (models.length === 0) continue;

		const providerRecord: Record<string, unknown> = {};
		providerRecord[providerId] = { baseUrl: baseUrls[0], api, models };
		const candidate: unknown = { providers: providerRecord };
		if (!validateModelsConfig.Check(candidate)) continue;
		const validated = candidate as ModelsJson;
		providers.set(providerId, deepFreeze(structuredClone(validated.providers[providerId])));
	}
	return { providers, error: undefined };
}

/** One immutable load of models.json. */
export class ModelConfig {
	private readonly providers: ReadonlyMap<string, ModelsJsonProvider>;
	private readonly error: string | undefined;

	private constructor(providers: ReadonlyMap<string, ModelsJsonProvider>, error?: string) {
		this.providers = providers;
		this.error = error;
	}

	static async load(modelsJsonPath: string | undefined): Promise<ModelConfig> {
		if (!modelsJsonPath) return new ModelConfig(new Map());
		const path = normalizePath(modelsJsonPath);
		let content: string;
		try {
			content = await readFile(path, "utf-8");
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") return new ModelConfig(new Map());
			return new ModelConfig(
				new Map(),
				`Failed to load models.json: ${error instanceof Error ? error.message : error}\n\nFile: ${path}`,
			);
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(stripJsonComments(stripBom(content)));
		} catch (error) {
			return new ModelConfig(
				new Map(),
				`Failed to parse models.json: ${error instanceof Error ? error.message : error}\n\nFile: ${path}`,
			);
		}

		if (!validateModelsConfig.Check(parsed)) {
			const errors =
				validateModelsConfig
					.Errors(parsed)
					.map((error) => `  - ${formatValidationPath(error)}: ${error.message}`)
					.join("\n") || "Unknown schema error";
			return new ModelConfig(new Map(), `Invalid models.json schema:\n${errors}\n\nFile: ${path}`);
		}

		const config = parsed as ModelsJson;
		const providers = new Map<string, ModelsJsonProvider>();
		for (const [providerId, provider] of Object.entries(config.providers)) {
			providers.set(providerId, deepFreeze(structuredClone(provider)));
		}

		// Merge providers from the upstream models-store.json catalog cache in memory
		// (auth.json credentials resolve by provider id; nothing is written to disk).
		const existingProviderIds: string[] = [];
		for (const existingId of providers.keys()) existingProviderIds.push(existingId);
		const synthesized = synthesizeProvidersFromModelsStore(
			join(dirname(normalizePath(path)), "models-store.json"),
			existingProviderIds,
		);
		for (const [providerId, provider] of synthesized.providers) {
			providers.set(providerId, provider);
		}

		return new ModelConfig(providers, synthesized.error ?? undefined);
	}

	getProvider(providerId: string): ModelsJsonProvider | undefined {
		return this.providers.get(providerId);
	}

	getProviderIds(): readonly string[] {
		return [...this.providers.keys()];
	}

	getError(): string | undefined {
		return this.error;
	}
}
