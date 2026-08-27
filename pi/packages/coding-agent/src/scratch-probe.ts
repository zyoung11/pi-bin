import type { Message } from "../../ai/src/types.ts";
import type {
	BashExecutionMessage as BEM,
	BranchSummaryMessage as BSM,
	CompactionSummaryMessage as CSM,
	CustomMessage as CM,
} from "../../agent/src/harness/messages.ts";

export function q1(v: Message[]): string {
	return v.length.toString();
}
export function q2(v: BEM[]): string {
	return v.length.toString();
}
export function q3(v: CM[]): string {
	return v.length.toString();
}
export function q4(v: BSM[]): string {
	return v.length.toString();
}
export function q5(v: CSM[]): string {
	return v.length.toString();
}
