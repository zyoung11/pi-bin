import type { OpenAICompletionsCompat } from "../../ai/src/types.ts";

export function c1(v: OpenAICompletionsCompat): Record<string, unknown> {
	const r = v as unknown as Record<string, unknown>;
	return r;
}
export function c2(v: Record<string, unknown>): OpenAICompletionsCompat {
	return v as unknown as OpenAICompletionsCompat;
}
export function c3(v: OpenAICompletionsCompat): OpenAICompletionsCompat {
	const clone = structuredClone(v);
	return clone;
}
export function c4(v: unknown): OpenAICompletionsCompat {
	return v as unknown as OpenAICompletionsCompat;
}
