// Probe for r46: wide-boundary tool definition patterns (Route W regression probe).
import { Box } from "../../tui/src/components/box.ts";
import { Text as RealText } from "../../tui/src/components/text.ts";
import type { Component } from "../../tui/src/tui.ts";

void Box;

import type { AgentToolResult } from "../../agent/src/index.ts";
import type { BashToolDetails } from "./core/tools/bash.ts";
import { createBashToolDefinition } from "./core/tools/bash.ts";
import { createEditToolDefinition } from "./core/tools/edit.ts";
import { createToolDefinition, type ToolDef } from "./core/tools/index.ts";
import { createReadToolDefinition } from "./core/tools/read.ts";
import type { ToolDefinition } from "./core/tools/tool-types.ts";
import { createWriteToolDefinition } from "./core/tools/write.ts";
import { theme } from "./modes/interactive/theme/theme.ts";
import "./core/keybindings.ts";

void theme;

export const realBash: ToolDef = createBashToolDefinition("/tmp", undefined);
export const realRead: ToolDef = createReadToolDefinition("/tmp", undefined);
export const realEdit: ToolDef = createEditToolDefinition("/tmp", undefined);
export const realWrite: ToolDef = createWriteToolDefinition("/tmp", undefined);
export const viaSwitch: ToolDef = createToolDefinition("bash", "/tmp", undefined);

interface SubState {
	startedAt: number | undefined;
}

class LocalSub extends RealText {
	tag = "sub";
	constructor() {
		super("", 0, 0);
	}
}

function subStateOf(state: unknown): SubState {
	return state as SubState;
}

function detailsOf(details: unknown): BashToolDetails | undefined {
	return details as BashToolDetails | undefined;
}

export const wideDef: ToolDefinition = {
	name: "probe",
	label: "probe",
	description: "probe",
	parameters: {},
	constrainedSampling: false,
	async execute(_toolCallId, params, signal, onUpdate): Promise<AgentToolResult<unknown>> {
		const { command } = params as { command: string };
		if (signal !== undefined && signal.aborted) throw new Error("aborted");
		onUpdate?.({ content: [{ type: "text", text: "partial " + command }], details: undefined });
		const result: AgentToolResult<unknown> = { content: [{ type: "text", text: command }], details: { a: 1 } };
		return result;
	},
	renderCall(args, _theme, context) {
		const state = subStateOf(context.state);
		const renderArgs = args as { command?: string } | undefined;
		const apply = (c: LocalSub): Component => {
			c.setText(renderArgs?.command ?? "?");
			return c as Component;
		};
		const last: Component | undefined = context.lastComponent;
		if (last === undefined) {
			return apply(new LocalSub());
		}
		if (last instanceof LocalSub) {
			return apply(last);
		}
		return apply(new LocalSub());
	},
	renderResult(result, options, _theme, context) {
		const state = subStateOf(context.state);
		const details = detailsOf(result.details);
		const last: Component | undefined = context.lastComponent;
		const text = `r ${String(details?.fullOutputPath ?? "")} ${String(options.expanded)} ${String(state.startedAt ?? 0)}`;
		if (last === undefined) {
			const t = new LocalSub();
			t.setText(text);
			return t as Component;
		}
		if (last instanceof RealText) {
			last.setText(text);
			return last as Component;
		}
		const t = new LocalSub();
		t.setText(text);
		return t as Component;
	},
};

class BoxSub extends Box {
	tag = "boxsub";
	constructor() {
		super(1, 1, (t: string) => t);
	}
}

function narrowBoxSub(lastComponent: Component | undefined): BoxSub {
	if (lastComponent === undefined) {
		const component = new BoxSub();
		return component;
	}
	if (lastComponent instanceof BoxSub) {
		const component = lastComponent;
		return component;
	}
	const component = new BoxSub();
	return component;
}

function boxStateOf(state: unknown): { c?: BoxSub } {
	return state as { c?: BoxSub };
}

function textStateOf(state: unknown): { c?: LocalSub } {
	return state as { c?: LocalSub };
}

function earlyStateOf(state: unknown): { c?: LateSub } {
	return state as { c?: LateSub };
}

class LateSub extends Box {
	constructor() {
		super(1, 1, (t: string) => t);
	}
}

function lateStateOf(state: unknown): { c?: LateSub } {
	return state as { c?: LateSub };
}

class TextSub extends RealText {
	constructor() {
		super("", 0, 0);
	}
}

interface P1State {
	a?: string;
	p?: { d: string; f: number | undefined } | { e: string };
}
export function p1(state: unknown): P1State {
	return state as P1State;
}
export const p1call: P1State = p1({});

interface P2State {
	a: string | undefined;
}
export function p2(state: unknown): P2State {
	return state as P2State;
}
export const p2call: P2State = p2({});

interface P3State {
	c?: TextSub;
}
export function p3(state: unknown): P3State {
	return state as P3State;
}
export const p3call: P3State = p3({});

interface P4State {
	c?: BoxSub;
}
export function p4(state: unknown): P4State {
	return state as P4State;
}
export const p4call: P4State = p4({});

export function classDoubleJump(provider: unknown): ModelsImpl {
	return provider as unknown as ModelsImpl;
}

import type { ModelsImpl } from "../../ai/src/models.ts";
