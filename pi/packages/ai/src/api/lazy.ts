import type { Api, AssistantMessage, AssistantMessageEvent, Model, ProviderStreams } from "../types.ts";
import { AssistantMessageEventStream } from "../utils/event-stream.ts";

function createSetupErrorMessage(model: Model<Api>, error: unknown): AssistantMessage {
	return {
		role: "assistant",
		content: [],
		api: model.api,
		provider: model.provider,
		model: model.id,
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		},
		stopReason: "error",
		errorMessage: error instanceof Error ? error.message : String(error),
		timestamp: Date.now(),
	};
}

async function forwardStream(
	target: AssistantMessageEventStream,
	source: AssistantMessageEventStream,
): Promise<void> {
	let step = await source.next();
	while (!step.done) {
		target.push(step.value as AssistantMessageEvent);
		step = await source.next();
	}
	target.end(await source.result());
}

/**
 * Returns a stream synchronously while running async setup (auth resolution,
 * lazy module loading) behind it. Setup failures terminate the stream with an
 * error event.
 */
export function lazyStream(
	model: Model<Api>,
	setup: () => Promise<AssistantMessageEventStream>,
): AssistantMessageEventStream {
	const outer = new AssistantMessageEventStream();

	setup()
		.then((inner) => forwardStream(outer, inner))
		.catch((caughtError) => {
			if (!(caughtError instanceof Error)) return;
			const message = createSetupErrorMessage(model, caughtError);
			outer.push({ type: "error", reason: "error", error: message });
			outer.end(message);
		});

	return outer;
}

/**
 * Wraps a dynamically imported API implementation module as `ProviderStreams`.
 * The module loads on first stream call; the host's import cache deduplicates
 * loads. Load failures terminate the returned stream with an error event.
 */
export interface LazyApiCapabilities {
	fetchDeferred?: boolean;
	cancelDeferred?: boolean;
}

export function lazyApi(load: () => Promise<ProviderStreams>, capabilities?: LazyApiCapabilities): ProviderStreams {
	const api: ProviderStreams = {
		stream: (model, context, options) =>
			lazyStream(model, async () => (await load()).stream(model, context, options)),
		streamSimple: (model, context, options) =>
			lazyStream(model, async () => (await load()).streamSimple(model, context, options)),
	};

	if (capabilities?.fetchDeferred) {
		api.fetchDeferred = (model, handle, options) =>
			lazyStream(model, async () => {
				const implementation = await load();
				const fetchDeferred = implementation.fetchDeferred;
				if (!fetchDeferred) throw new Error("API does not support deferred responses");
				return fetchDeferred(model, handle, options);
			});
	}
	if (capabilities?.cancelDeferred) {
		api.cancelDeferred = async (model, handle, options) => {
			const implementation = await load();
			const cancelDeferred = implementation.cancelDeferred;
			if (!cancelDeferred) throw new Error("API cannot cancel deferred responses");
			await cancelDeferred(model, handle, options);
		};
	}

	return api;
}
