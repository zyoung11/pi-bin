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

/** One one-token completion is small, but a busy server queues it behind its own work. */
const LEVEL_PROBE_TIMEOUT_MS = 10000;

/** Thinking levels a template can accept, in ladder order. */
const THINKING_LEVELS = ["minimal", "low", "medium", "high", "xhigh", "max"];

/** Per-server level verdicts, so a catalog refresh never repeats the probe requests. */
const thinkingLevelProbeCache = new Map<string, string>();

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
 * Server root for a provider base URL: the OpenAI-compatible API carries a /v1
 * suffix and trailing slashes, while the management endpoints sit at the root.
 */
function serverRoot(baseUrl: string): string {
	let root = baseUrl.trim();
	while (root.endsWith("/")) root = root.slice(0, root.length - 1);
	if (root.endsWith("/v1")) root = root.slice(0, root.length - 3);
	return root;
}

/**
 * Build the /props URL for one model. The props endpoint sits at the server
 * root while the OpenAI API base carries a /v1 suffix, so the suffix is dropped
 * before /props is appended. `autoload=false` keeps the query from loading a
 * router preset or waking a sleeping model.
 */
export function chatTemplatePropsUrl(baseUrl: string, modelId: string): string {
	return `${serverRoot(baseUrl)}/props?model=${encodeURIComponent(modelId)}&autoload=false`;
}

/** Completions endpoint of one server: template render happens before generation. */
function chatCompletionUrl(baseUrl: string): string {
	return `${serverRoot(baseUrl)}/v1/chat/completions`;
}

/** Render endpoint of one server: it answers with the prompt a template produced and runs no inference. */
function applyTemplateUrl(baseUrl: string): string {
	return `${serverRoot(baseUrl)}/apply-template`;
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

/** Error texts that name the effort value the template refused. */
const EFFORT_REJECTION_WORDS = [
	"unexpected",
	"supported types",
	"not supported",
	"unsupported",
	"must be",
	"unknown effort",
	"expected effort",
];

/**
 * A rejection names both the effort field and the bad value, which a transport,
 * schema, or capacity error does not. Anything less stays unjudged, so an
 * unrelated failure cannot hide a level the template really accepts.
 */
function rejectsEffortValue(body: string): boolean {
	const lower = body.toLowerCase();
	if (lower.indexOf("reasoning effort") === -1 && lower.indexOf("reasoning_effort") === -1) return false;
	for (const word of EFFORT_REJECTION_WORDS) {
		if (lower.indexOf(word) !== -1) return true;
	}
	return false;
}

/** Outcome of one level render: the template took it, refused it, or the probe could not tell. */
interface ThinkingLevelRender {
	verdict: string;
	prompt: string;
}

/**
 * Probe which thinking levels a loaded model's chat template accepts, and
 * which of them are one level under two names. The server's own template
 * render is the source of truth: `/apply-template` answers with the prompt the
 * template produced and runs no inference, so a refused level fails at render
 * time and names the value it will not take, while two levels that render the
 * same prompt are aliases of one behaviour. A server without that endpoint
 * falls back to one one-token completion per level, which settles acceptance
 * only. The result is cached per server and model, so the probes run once per
 * process instead of on every catalog refresh.
 * @param baseUrl Server root or OpenAI-compatible base of the router
 * @param apiKey Bearer key when the server requires one
 * @param modelId Model to probe, which must be loaded
 * @param signal Cancels the probes
 * @returns thinkingLevelMap entries for the model, or undefined when nothing was learned
 */
export async function probeThinkingLevels(
	baseUrl: string,
	apiKey: string | undefined,
	modelId: string,
	signal: AbortSignal,
): Promise<Record<string, unknown> | undefined> {
	const cacheKey = `${serverRoot(baseUrl)}|${modelId}`;
	const cached = thinkingLevelProbeCache.get(cacheKey);
	if (cached !== undefined) return JSON.parse(cached) as Record<string, unknown>;
	const renders = await renderThinkingLevels(baseUrl, apiKey, modelId, signal);
	let map = levelMapFromRenders(renders);
	if (map === undefined) map = await levelMapFromCompletions(baseUrl, apiKey, modelId, signal);
	if (map === undefined) return undefined;
	thinkingLevelProbeCache.set(cacheKey, JSON.stringify(map));
	return map;
}

/** Render the prompt of every thinking level through the server's template, without inference. */
async function renderThinkingLevels(
	baseUrl: string,
	apiKey: string | undefined,
	modelId: string,
	signal: AbortSignal,
): Promise<ThinkingLevelRender[]> {
	const renders: Array<Promise<ThinkingLevelRender>> = [];
	for (const level of THINKING_LEVELS) {
		renders.push(renderThinkingLevel(baseUrl, apiKey, modelId, level, signal));
	}
	return Promise.all(renders);
}

/**
 * Render one thinking level through the server's chat template.
 * @returns the rendered prompt when the template took the level, a rejection when it refused, unknown otherwise
 */
async function renderThinkingLevel(
	baseUrl: string,
	apiKey: string | undefined,
	modelId: string,
	level: string,
	signal: AbortSignal,
): Promise<ThinkingLevelRender> {
	const failure: ThinkingLevelRender = { verdict: "unknown", prompt: "" };
	try {
		const headers: Record<string, string> = { "Content-Type": "application/json" };
		if (apiKey !== undefined && apiKey.length > 0) headers["Authorization"] = `Bearer ${apiKey}`;
		const probeSignal = AbortSignal.any([signal, AbortSignal.timeout(LEVEL_PROBE_TIMEOUT_MS)]);
		const response = await fetch(applyTemplateUrl(baseUrl), {
			method: "POST",
			headers,
			body: JSON.stringify({
				model: modelId,
				messages: [{ role: "user", content: "hi" }],
				reasoning_effort: level,
				chat_template_kwargs: { enable_thinking: true, preserve_thinking: true },
			}),
			signal: probeSignal,
		});
		if (response.ok) {
			const prompt = lookupString(safeJson(await response.text()), "prompt");
			return prompt === undefined ? failure : { verdict: "accepted", prompt };
		}
		if (rejectsEffortValue(await response.text())) return { verdict: "rejected", prompt: "" };
		return failure;
	} catch {
		return failure;
	}
}

/**
 * Build the map from rendered prompts. Refused levels are hidden, and levels
 * whose prompts come out identical are one behaviour under two names, so every
 * alias is hidden behind the name the template itself resolved to.
 */
function levelMapFromRenders(renders: ThinkingLevelRender[]): Record<string, unknown> | undefined {
	let judged = 0;
	for (const render of renders) {
		if (render.verdict !== "unknown") judged++;
	}
	if (judged === 0) return undefined;
	const map: Record<string, unknown> = {};
	for (let index = 0; index < renders.length; index++) {
		const render = renders[index];
		if (render.verdict === "unknown") continue;
		map[THINKING_LEVELS[index]] = render.verdict === "accepted" ? THINKING_LEVELS[index] : null;
	}
	for (let index = 0; index < renders.length; index++) {
		const render = renders[index];
		if (render.verdict !== "accepted") continue;
		const samePrompt: string[] = [];
		for (let other = 0; other < renders.length; other++) {
			if (renders[other].verdict !== "accepted") continue;
			if (renders[other].prompt !== render.prompt) continue;
			samePrompt.push(THINKING_LEVELS[other]);
		}
		if (samePrompt.length < 2) continue;
		const named = levelNamedInAnyPrompt(render.prompt, samePrompt);
		const representative = named ?? samePrompt[samePrompt.length - 1];
		map[representative] = representative;
		for (const name of samePrompt) {
			if (name === representative) continue;
			map[name] = null;
		}
	}
	return map;
}

/**
 * The prompt a template produced names the value it resolved to, as in
 * "Reasoning effort is set to xhigh", which tells the canonical name of an
 * alias pair apart from the name the template rewrote. A name counts only as a
 * whole word, so `high` does not match inside `xhigh`.
 * @returns the level name the prompt carries, preferring the longest one when several match
 */
function levelNamedInAnyPrompt(prompt: string, levels: string[]): string | undefined {
	let found: string | undefined;
	for (const level of levels) {
		if (!levelNamedInPrompt(prompt, level)) continue;
		if (found === undefined || level.length > found.length) found = level;
	}
	return found;
}

function levelNamedInPrompt(prompt: string, level: string): boolean {
	let index = prompt.indexOf(level);
	while (index !== -1) {
		const before = index === 0 ? "" : prompt.charAt(index - 1);
		const after = prompt.charAt(index + level.length);
		if (!isWordChar(before) && !isWordChar(after)) return true;
		index = prompt.indexOf(level, index + 1);
	}
	return false;
}

function isWordChar(char: string): boolean {
	if (char.length === 0) return false;
	const code = char.charCodeAt(0);
	const lower = code >= 97 && code <= 122;
	const upper = code >= 65 && code <= 90;
	const digit = code >= 48 && code <= 57;
	return lower || upper || digit || code === 95;
}

function safeJson(text: string): unknown {
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return undefined;
	}
}

/**
 * Fall back to one one-token completion per level for a server without
 * /apply-template. The template still fails at render time and names the value
 * it will not take, but without the rendered prompt two aliases of one level
 * cannot be told apart and both stay visible.
 */
async function levelMapFromCompletions(
	baseUrl: string,
	apiKey: string | undefined,
	modelId: string,
	signal: AbortSignal,
): Promise<Record<string, unknown> | undefined> {
	const probes: Array<Promise<string>> = [];
	for (const level of THINKING_LEVELS) {
		probes.push(probeThinkingLevelViaCompletion(baseUrl, apiKey, modelId, level, signal));
	}
	const outcomes = await Promise.all(probes);
	const map: Record<string, unknown> = {};
	let judged = 0;
	for (let index = 0; index < outcomes.length; index++) {
		const verdict = outcomes[index];
		if (verdict === "unknown") continue;
		judged++;
		map[THINKING_LEVELS[index]] = verdict === "accepted" ? THINKING_LEVELS[index] : null;
	}
	if (judged === 0) return undefined;
	return map;
}

/**
 * Send one one-token completion for a single thinking level.
 * @returns "accepted" when the template renders, "rejected" when it refuses the level, "unknown" otherwise
 */
async function probeThinkingLevelViaCompletion(
	baseUrl: string,
	apiKey: string | undefined,
	modelId: string,
	level: string,
	signal: AbortSignal,
): Promise<string> {
	try {
		const headers: Record<string, string> = { "Content-Type": "application/json" };
		if (apiKey !== undefined && apiKey.length > 0) headers["Authorization"] = `Bearer ${apiKey}`;
		const probeSignal = AbortSignal.any([signal, AbortSignal.timeout(LEVEL_PROBE_TIMEOUT_MS)]);
		const response = await fetch(chatCompletionUrl(baseUrl), {
			method: "POST",
			headers,
			body: JSON.stringify({
				model: modelId,
				messages: [{ role: "user", content: "hi" }],
				max_tokens: 1,
				stream: false,
				reasoning_effort: level,
				chat_template_kwargs: { enable_thinking: true, preserve_thinking: true },
			}),
			signal: probeSignal,
		});
		if (response.ok) return "accepted";
		return rejectsEffortValue(await response.text()) ? "rejected" : "unknown";
	} catch {
		return "unknown";
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
