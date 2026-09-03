import type { ProviderStreams } from "../types.ts";
import { lazyApi } from "./lazy.ts";
import { stream, streamSimple } from "./openai-completions.ts";

export const openAICompletionsApi = (): ProviderStreams =>
	lazyApi(
		async () =>
			({
				stream,
				streamSimple,
			}) as ProviderStreams,
	);
