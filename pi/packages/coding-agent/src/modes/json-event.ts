import type { Usage } from "../../../ai/src/index.ts";
import type { AgentSessionEvent } from "../core/agent-session.ts";

type WithoutPartial<T> = T extends { partial: unknown } ? Omit<T, "partial"> : T;

type ToJsonAssistantMessageEvent<T> = T extends { type: "toolcall_start"; partial: unknown }
	? WithoutPartial<T> & { id: string; toolName: string }
	: WithoutPartial<T>;

type MessageUpdateEvent = Extract<AgentSessionEvent, { type: "message_update" }>;
type JsonMessageUpdateEvent = {
	type: "message_update";
	usage: Usage;
	assistantMessageEvent: ToJsonAssistantMessageEvent<MessageUpdateEvent["assistantMessageEvent"]>;
};

/** Session event shape emitted by the JSON and RPC stdout protocols. */
export type JsonAgentSessionEvent = Exclude<AgentSessionEvent, { type: "message_update" }> | JsonMessageUpdateEvent;

function toJsonAssistantMessageEvent(
	event: MessageUpdateEvent["assistantMessageEvent"],
): JsonMessageUpdateEvent["assistantMessageEvent"] {
	if (event.type === "toolcall_start") {
		return { type: "toolcall_start", contentIndex: event.contentIndex, id: event.id, toolName: event.toolName };
	}
	if (event.type === "start") {
		return { type: "start" };
	}
	if (event.type === "text_start") {
		return { type: "text_start", contentIndex: event.contentIndex };
	}
	if (event.type === "text_delta") {
		return { type: "text_delta", contentIndex: event.contentIndex, delta: event.delta };
	}
	if (event.type === "text_end") {
		return { type: "text_end", contentIndex: event.contentIndex, content: event.content };
	}
	if (event.type === "thinking_start") {
		return { type: "thinking_start", contentIndex: event.contentIndex };
	}
	if (event.type === "thinking_delta") {
		return { type: "thinking_delta", contentIndex: event.contentIndex, delta: event.delta };
	}
	if (event.type === "thinking_end") {
		return { type: "thinking_end", contentIndex: event.contentIndex, content: event.content };
	}
	if (event.type === "toolcall_delta") {
		return { type: "toolcall_delta", contentIndex: event.contentIndex, delta: event.delta };
	}
	if (event.type === "toolcall_end") {
		return { type: "toolcall_end", contentIndex: event.contentIndex, toolCall: event.toolCall };
	}
	return event;
}

/**
 * Remove cumulative assistant snapshots from streaming wire events.
 * `message_start` provides the initial message, deltas build it, and
 * `message_end` provides the final authoritative message. Cumulative usage,
 * tool-call ids, and tool names remain available because their size is constant.
 */
export function toJsonEvent(event: AgentSessionEvent): JsonAgentSessionEvent {
	if (event.type !== "message_update") {
		return event;
	}
	if (event.message.role !== "assistant") {
		throw new Error("message_update message is not an assistant message");
	}

	return {
		type: "message_update",
		usage: event.message.usage,
		assistantMessageEvent: toJsonAssistantMessageEvent(event.assistantMessageEvent),
	};
}
