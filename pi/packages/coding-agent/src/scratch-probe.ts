import type {
	UserMessage,
	AssistantMessage,
	ToolResultMessage,
} from "../../ai/src/types.ts";
import type {
	BashExecutionMessage as BEM,
	BranchSummaryMessage as BSM,
	CompactionSummaryMessage as CSM,
	CustomMessage as CM,
} from "../../agent/src/harness/messages.ts";

export function pA(v: (UserMessage | AssistantMessage | ToolResultMessage | BEM | CM | BSM | CSM)[]): string {
	return v.length.toString();
}
