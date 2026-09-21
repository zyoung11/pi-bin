/** llama.cpp chat-template thinking detection. */

/** Provider whose models are probed through the llama.cpp /props endpoint. */
export interface ChatTemplateThinkingTarget {
	providerId: string;
	baseUrl: string;
	apiKey: string | undefined;
	modelIds: string[];
}

/**
 * Models whose chat template toggles thinking through enable_thinking.
 * `effortModelIds` is the subset whose template also accepts `reasoning_effort`,
 * so pi can keep the per-level depth next to the boolean toggle.
 */
export interface ChatTemplateThinkingDetection {
	providerId: string;
	modelIds: string[];
	effortModelIds: string[];
}

/** A llama.cpp server answers /props in milliseconds; an unreachable server must not delay a refresh. */
const CHAT_TEMPLATE_PROBE_TIMEOUT_MS = 1000;

function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

function lookupString(value: unknown, key: string): string | undefined {
	if (value === null || typeof value !== "object") return undefined;
	const found = recordViewOf(value)[key];
	return typeof found === "string" ? found : undefined;
}

function lookupRecord(value: unknown, key: string): Record<string, unknown> | undefined {
	if (value === null || typeof value !== "object") return undefined;
	const found = recordViewOf(value)[key];
	if (found === null || typeof found !== "object") return undefined;
	return recordViewOf(found);
}

/**
 * Build the /props URL for one model. The props endpoint sits at the server
 * root while the OpenAI API base carries a /v1 suffix, so the suffix is dropped
 * before /props is appended. `autoload=false` keeps the query from loading a
 * router preset or waking a sleeping model.
 */
export function chatTemplatePropsUrl(baseUrl: string, modelId: string): string {
	let root = baseUrl.trim();
	while (root.endsWith("/")) root = root.slice(0, root.length - 1);
	if (root.endsWith("/v1")) root = root.slice(0, root.length - 3);
	return `${root}/props?model=${encodeURIComponent(modelId)}&autoload=false`;
}

/** Verdict for one model: the template toggles thinking and may also accept reasoning_effort. */
interface ChatTemplateProbe {
	thinking: boolean;
	effort: boolean;
}

/** Query one model's chat template and template capabilities; any failure leaves the model unclassified. */
async function probeChatTemplate(
	url: string,
	apiKey: string | undefined,
	signal: AbortSignal,
): Promise<ChatTemplateProbe> {
	const failure: ChatTemplateProbe = { thinking: false, effort: false };
	try {
		const headers: Record<string, string> = {};
		if (apiKey !== undefined && apiKey.length > 0) headers["Authorization"] = `Bearer ${apiKey}`;
		const response = await fetch(url, { headers, signal });
		if (!response.ok) return failure;
		const payload: unknown = JSON.parse(await response.text());
		const template = lookupString(payload, "chat_template");
		if (template === undefined || !template.includes("enable_thinking")) return failure;
		const caps = lookupRecord(payload, "chat_template_caps");
		return { thinking: true, effort: caps !== undefined && caps["supports_reasoning_effort"] === true };
	} catch {
		return failure;
	}
}

/**
 * Probe every configured model of the given providers and report which chat
 * templates toggle thinking through enable_thinking, plus the subset whose
 * template also accepts reasoning_effort. Models the server cannot describe
 * (unloaded router presets, sleeping instances, unreachable servers) stay
 * unclassified and are retried on the next refresh. Individual probes run
 * concurrently; each provider shares one timeout so a dead server costs one
 * bounded wait instead of one per model.
 */
export async function detectChatTemplateThinking(
	targets: readonly ChatTemplateThinkingTarget[],
	signal: AbortSignal,
): Promise<ChatTemplateThinkingDetection[]> {
	const detections: ChatTemplateThinkingDetection[] = [];
	let targetIndex = 0;
	while (targetIndex < targets.length) {
		const target = targets[targetIndex];
		targetIndex++;
		if (signal.aborted) return detections;
		const probeSignal = AbortSignal.any([signal, AbortSignal.timeout(CHAT_TEMPLATE_PROBE_TIMEOUT_MS)]);
		const probes: Array<Promise<ChatTemplateProbe>> = [];
		for (const modelId of target.modelIds) {
			probes.push(probeChatTemplate(chatTemplatePropsUrl(target.baseUrl, modelId), target.apiKey, probeSignal));
		}
		const outcomes = await Promise.all(probes);
		const modelIds: string[] = [];
		const effortModelIds: string[] = [];
		for (let index = 0; index < outcomes.length; index++) {
			if (outcomes[index].thinking !== true) continue;
			const modelId = target.modelIds[index];
			if (typeof modelId !== "string") continue;
			modelIds.push(modelId);
			if (outcomes[index].effort === true) effortModelIds.push(modelId);
		}
		if (modelIds.length > 0) detections.push({ providerId: target.providerId, modelIds, effortModelIds });
	}
	return detections;
}
