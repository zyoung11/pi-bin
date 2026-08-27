import type { AgentTool } from "../../../../agent/src/index.ts";
import type { ToolDefinition } from "./tool-types.ts";

/** Wrap a ToolDefinition into an AgentTool for the core runtime. */
export function wrapToolDefinition<TDetails = unknown>(definition: ToolDefinition<any, TDetails>): AgentTool<any, TDetails> {
	return {
		name: definition.name,
		label: definition.label,
		description: definition.description,
		parameters: definition.parameters,
		constrainedSampling: definition.constrainedSampling,
		prepareArguments: definition.prepareArguments,
		executionMode: definition.executionMode,
		execute: (toolCallId, params, signal, onUpdate) =>
			definition.execute(toolCallId, params, signal, onUpdate),
	};
}

/** Wrap multiple ToolDefinitions into AgentTools for the core runtime. */
export function wrapToolDefinitions(definitions: ToolDefinition[]): AgentTool[] {
	return definitions.map((definition) => wrapToolDefinition(definition));
}

/**
 * Synthesize a minimal ToolDefinition from an AgentTool.
 *
 * This keeps AgentSession's internal registry definition-first even when a caller
 * provides plain AgentTool overrides that do not include prompt metadata or renderers.
 */
export function createToolDefinitionFromAgentTool(tool: AgentTool): ToolDefinition<any, unknown> {
	return {
		name: tool.name,
		label: tool.label,
		description: tool.description,
		parameters: tool.parameters as any,
		constrainedSampling: tool.constrainedSampling,
		prepareArguments: tool.prepareArguments,
		executionMode: tool.executionMode,
		execute: async (toolCallId, params, signal, onUpdate) => tool.execute(toolCallId, params, signal, onUpdate),
	};
}
