import type { Api, Model, ProviderHeaders } from "../../../ai/src/index.ts";

const OPENROUTER_HOST = "openrouter.ai";
const NVIDIA_NIM_HOST = "integrate.api.nvidia.com";
const CLOUDFLARE_API_HOST = "api.cloudflare.com";
const CLOUDFLARE_AI_GATEWAY_HOST = "gateway.ai.cloudflare.com";
const OPENCODE_HOST = "opencode.ai";

function matchesHost(baseUrl: string, expectedHost: string): boolean {
	const schemeIdx = baseUrl.indexOf("://");
	if (schemeIdx === -1) return false;
	const rest = baseUrl.slice(schemeIdx + 3);
	const slashIdx = rest.indexOf("/");
	const hostPart = slashIdx === -1 ? rest : rest.slice(0, slashIdx);
	const atIdx = hostPart.indexOf("@");
	const hostNoUser = atIdx === -1 ? hostPart : hostPart.slice(atIdx + 1);
	const colonIdx = hostNoUser.lastIndexOf(":");
	const hostname = colonIdx > 0 ? hostNoUser.slice(0, colonIdx) : hostNoUser;
	return hostname === expectedHost;
}

function isOpenRouterModel(model: Model<Api>): boolean {
	return model.provider === "openrouter" || model.baseUrl.includes(OPENROUTER_HOST);
}

function isNvidiaNimModel(model: Model<Api>): boolean {
	return model.provider === "nvidia" || matchesHost(model.baseUrl, NVIDIA_NIM_HOST);
}

function isCloudflareModel(model: Model<Api>): boolean {
	return (
		model.provider === "cloudflare-workers-ai" ||
		model.provider === "cloudflare-ai-gateway" ||
		matchesHost(model.baseUrl, CLOUDFLARE_API_HOST) ||
		matchesHost(model.baseUrl, CLOUDFLARE_AI_GATEWAY_HOST)
	);
}

function getDefaultAttributionHeaders(model: Model<Api>): Record<string, string> | undefined {
	if (isOpenRouterModel(model)) {
		return {
			"HTTP-Referer": "https://pi.dev",
			"X-OpenRouter-Title": "pi",
			"X-OpenRouter-Categories": "cli-agent",
		};
	}

	if (isNvidiaNimModel(model)) {
		return {
			"X-BILLING-INVOKE-ORIGIN": "Pi",
		};
	}

	if (isCloudflareModel(model)) {
		return {
			"User-Agent": "pi-coding-agent",
		};
	}

	return undefined;
}

function getSessionHeaders(model: Model<Api>, sessionId: string | undefined): Record<string, string> | undefined {
	if (!sessionId) return undefined;
	if (
		model.provider !== "opencode" &&
		model.provider !== "opencode-go" &&
		!matchesHost(model.baseUrl, OPENCODE_HOST)
	) {
		return undefined;
	}
	return { "x-opencode-session": sessionId, "x-opencode-client": "pi" };
}

export function mergeProviderAttributionHeaders(
	model: Model<Api>,
	sessionId: string | undefined,
	...headerSources: Array<ProviderHeaders | undefined>
): ProviderHeaders | undefined {
	const merged: ProviderHeaders = {};
	const sessionHeaders = getSessionHeaders(model, sessionId) ?? {};
	for (const key of Object.keys(sessionHeaders)) {
		merged[key] = sessionHeaders[key];
	}
	const attributionHeaders = getDefaultAttributionHeaders(model) ?? {};
	for (const key of Object.keys(attributionHeaders)) {
		merged[key] = attributionHeaders[key];
	}

	for (const headers of headerSources) {
		if (headers) {
			Object.assign(merged, headers);
		}
	}

	return Object.keys(merged).length > 0 ? merged : undefined;
}
