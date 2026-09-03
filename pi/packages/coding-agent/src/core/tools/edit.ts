import { existsSync } from "node:fs";
import { constants } from "fs";
import { readFile as fsReadFile, writeFile as fsWriteFile } from "fs/promises";
import type { AgentTool, AgentToolResult } from "../../../../agent/src/index.ts";
import { type Static, Type } from "../../../../ai/src/schema.ts";
import type { ImageContent, TextContent } from "../../../../ai/src/types.ts";
import { Box } from "../../../../tui/src/components/box.ts";
import { Spacer } from "../../../../tui/src/components/spacer.ts";
import { Text } from "../../../../tui/src/components/text.ts";
import { type Component, Container } from "../../../../tui/src/tui.ts";
import { renderDiff } from "../../modes/interactive/components/diff.ts";
import type { Theme } from "../../modes/interactive/theme/theme.ts";
import { splitBom } from "../../utils/text.ts";
import { getExperimentalToolSampling } from "../experimental.ts";
import {
	applyEditsToNormalizedContent,
	computeEditsDiff,
	detectLineEnding,
	type Edit,
	type EditDiffError,
	type EditDiffResult,
	generateDiffString,
	generateUnifiedPatch,
	normalizeToLF,
	restoreLineEndings,
} from "./edit-diff.ts";
import { withFileMutationQueue } from "./file-mutation-queue.ts";
import { resolveToCwd } from "./path-utils.ts";
import { renderToolPath, str } from "./render-utils.ts";
import { wrapToolDefinition } from "./tool-definition-wrapper.ts";
import type { ToolDefinition } from "./tool-types.ts";

type EditPreview = EditDiffResult | EditDiffError;

function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

function editStateOf(state: unknown): Record<string, unknown> {
	return state as Record<string, unknown>;
}

function resetEditState(state: Record<string, unknown>, argsKey: string | undefined): void {
	state["preview"] = undefined;
	state["previewArgsKey"] = argsKey;
	state["previewPending"] = false;
	state["settledError"] = false;
}

function markPreviewPending(state: Record<string, unknown>): void {
	state["previewPending"] = true;
}

function writeSettledError(state: Record<string, unknown>, isError: boolean): void {
	state["settledError"] = isError;
}

function editDetailsOf(details: unknown): EditToolDetails | undefined {
	return details as EditToolDetails | undefined;
}

function errorCodeOf(error: unknown): string | undefined {
	return (error as { code?: string }).code;
}

const replaceEditSchema = Type.Object(
	{
		oldText: Type.String({
			description:
				"Exact text for one targeted replacement. It must be unique in the original file and must not overlap with any other edits[].oldText in the same call.",
		}),
		newText: Type.String({ description: "Replacement text for this targeted edit." }),
	},
	{},
);

const editSchema = Type.Object(
	{
		path: Type.String({ description: "Path to the file to edit (relative or absolute)" }),
		edits: Type.Array(replaceEditSchema, {
			description:
				"One or more targeted replacements. Each edit is matched against the original file, not incrementally. Do not include overlapping or nested edits. If two changes touch the same block or nearby lines, merge them into one edit instead.",
		}),
	},
	{},
);

export const editToolSystemPromptContribution = {
	snippet: "Make precise file edits with exact text replacement, including multiple disjoint edits in one call",
	guidelines: [
		"Use edit for precise changes (edits[].oldText must match exactly)",
		"When changing multiple separate locations in one file, use one edit call with multiple entries in edits[] instead of multiple edit calls",
		"Each edits[].oldText is matched against the original file, not after earlier edits are applied. Do not emit overlapping or nested edits. Merge nearby changes into one edit.",
		"Keep edits[].oldText as small as possible while still being unique in the file. Do not pad with large unchanged regions.",
	],
} as const;

export type EditToolInput = Static<typeof editSchema>;
type LegacyEditToolInput = EditToolInput & {
	oldText?: string;
	newText?: string;
};

type SingleEditInput = { oldText: string; newText: string };

function isSingleEditInput(value: unknown): value is SingleEditInput {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	const edit = value as Record<string, unknown>;
	return typeof edit.oldText === "string" && typeof edit.newText === "string";
}

export interface EditToolDetails {
	/** Display-oriented diff of the changes made */
	diff: string;
	/** Standard unified patch of the changes made */
	patch: string;
	/** Line number of the first change in the new file (for editor navigation) */
	firstChangedLine?: number;
}

/**
 * Pluggable operations for the edit tool.
 * Override these to delegate file editing to remote systems (for example SSH).
 */
export interface EditOperations {
	/** Read file contents as a Buffer */
	readFile: (absolutePath: string) => Promise<Buffer>;
	/** Write content to a file */
	writeFile: (absolutePath: string, content: string) => Promise<void>;
	/** Check if file is readable and writable (throw if not) */
	access: (absolutePath: string) => Promise<void>;
}

const defaultEditOperations: EditOperations = {
	readFile: (path) => fsReadFile(path),
	writeFile: async (path, content) => {
		fsWriteFile(path, content, "utf-8");
	},
	access: async (path) => {
		if (!existsSync(path)) return;
	},
};

export interface EditToolOptions {
	/** Custom operations for file editing. Default: local filesystem */
	operations?: EditOperations;
}

function prepareEditArguments(input: unknown): unknown {
	if (!input || typeof input !== "object") {
		return input as EditToolInput;
	}

	const args = input as Record<string, unknown>;

	// Some models (Opus 4.6, GLM-5.1) send edits as a JSON string instead of an array.
	// Others send a single edit object instead of a one-element edits array.
	if (typeof args.edits === "string") {
		try {
			const parsed = JSON.parse(args.edits);
			if (Array.isArray(parsed)) {
				args.edits = parsed;
			} else if (isSingleEditInput(parsed)) {
				args.edits = [parsed];
			}
		} catch {}
	} else if (isSingleEditInput(args.edits)) {
		args.edits = [args.edits];
	}

	const legacy = JSON.parse(JSON.stringify(args)) as LegacyEditToolInput;
	if (typeof legacy.oldText !== "string" || typeof legacy.newText !== "string") {
		return args as EditToolInput;
	}

	const edits = Array.isArray(legacy.edits) ? legacy.edits.slice() : [];
	edits.push({ oldText: legacy.oldText, newText: legacy.newText });
	const rebuilt: Record<string, unknown> = {};
	const legacyRecord = recordViewOf(legacy);
	for (const key of Object.keys(legacyRecord)) {
		if (key === "oldText" || key === "newText") continue;
		rebuilt[key] = legacyRecord[key];
	}
	rebuilt["edits"] = edits;
	return rebuilt as unknown as EditToolInput;
}

function validateEditInput(input: EditToolInput): { path: string; edits: Edit[] } {
	if (!Array.isArray(input.edits) || input.edits.length === 0) {
		throw new Error("Edit tool input is invalid. edits must contain at least one replacement.");
	}
	return { path: input.path, edits: input.edits };
}

type RenderableEditArgs = {
	path?: string;
	file_path?: string;
	edits?: Edit[];
	oldText?: string;
	newText?: string;
};

type EditToolResultLike = {
	content: (TextContent | ImageContent)[];
	details?: EditToolDetails;
};

class EditCallRenderComponent extends Box {
	preview: EditPreview | undefined = undefined;
	previewArgsKey: string | undefined = undefined;
	previewPending = false;
	settledError = false;

	constructor() {
		super(1, 1, (text: string) => text);
	}
}

function getRenderablePreviewInput(args: RenderableEditArgs | undefined): { path: string; edits: Edit[] } | null {
	if (!args) {
		return null;
	}

	const path = typeof args.path === "string" ? args.path : typeof args.file_path === "string" ? args.file_path : null;
	if (!path) {
		return null;
	}

	if (
		Array.isArray(args.edits) &&
		args.edits.length > 0 &&
		args.edits.every((edit) => typeof edit?.oldText === "string" && typeof edit?.newText === "string")
	) {
		return { path, edits: args.edits };
	}

	if (typeof args.oldText === "string" && typeof args.newText === "string") {
		return { path, edits: [{ oldText: args.oldText, newText: args.newText }] };
	}

	return null;
}

function formatEditCall(args: RenderableEditArgs | undefined, theme: Theme, cwd: string): string {
	const pathDisplay = renderToolPath(str(args?.file_path ?? args?.path), theme, cwd);
	return `${theme.fg("toolTitle", theme.bold("edit"))} ${pathDisplay}`;
}

function formatEditResult(
	args: RenderableEditArgs | undefined,
	preview: EditPreview | undefined,
	result: EditToolResultLike,
	theme: Theme,
	isError: boolean,
): string | undefined {
	const rawPath = str(args?.file_path ?? args?.path);
	const previewDiff = previewDiffOf(preview);
	const previewError = previewErrorOf(preview);
	if (isError) {
		const textParts: string[] = [];
		for (const c of result.content) {
			if (c.type === "text") {
				textParts.push(c.text || "");
			}
		}
		const errorText = textParts.join("\n");
		if (!errorText || errorText === previewError) {
			return undefined;
		}
		return theme.fg("error", errorText);
	}

	const resultDiff = result.details?.diff;
	if (resultDiff && resultDiff !== previewDiff) {
		return renderDiff(resultDiff, { filePath: rawPath ?? undefined });
	}

	return undefined;
}

function getEditHeaderBg(
	preview: EditPreview | undefined,
	settledError: boolean | undefined,
	theme: Theme,
): (text: string) => string {
	if (preview !== undefined) {
		if (previewHasError(preview)) {
			return (text: string) => theme.bg("toolErrorBg", text);
		}
		return (text: string) => theme.bg("toolSuccessBg", text);
	}
	if (settledError) {
		return (text: string) => theme.bg("toolErrorBg", text);
	}
	return (text: string) => theme.bg("toolPendingBg", text);
}

function buildEditCallComponent(
	component: EditCallRenderComponent,
	args: RenderableEditArgs | undefined,
	theme: Theme,
	cwd: string,
): EditCallRenderComponent {
	component.setBgFn(getEditHeaderBg(component.preview, component.settledError, theme));
	component.clear();
	component.addChild(new Text(formatEditCall(args, theme, cwd), 0, 0));

	if (!component.preview) {
		return component;
	}

	const previewRecord = previewRecordOf(component.preview);
	const body =
		previewRecord["error"] !== undefined
			? theme.fg("error", previewRecord["error"] as string)
			: renderDiff(previewRecord["diff"] as string);
	component.addChild(new Spacer(1));
	component.addChild(new Text(body, 0, 0));
	return component;
}

/** Bracket access for EditPreview unions (in-operator has no union lowering). */
function previewRecordOf(preview: EditPreview): Record<string, unknown> {
	return JSON.parse(JSON.stringify(preview)) as Record<string, unknown>;
}

function previewHasError(preview: EditPreview): boolean {
	return previewRecordOf(preview)["error"] !== undefined;
}

function previewDiffOf(preview: EditPreview | undefined): string | undefined {
	if (preview === undefined) {
		return undefined;
	}
	const record = previewRecordOf(preview);
	if (record["error"] !== undefined) {
		return undefined;
	}
	return record["diff"] as string | undefined;
}

function previewErrorOf(preview: EditPreview | undefined): string | undefined {
	if (preview === undefined) {
		return undefined;
	}
	const record = previewRecordOf(preview);
	if (record["error"] === undefined) {
		return undefined;
	}
	return record["error"] as string;
}

function setEditPreviewState(
	state: Record<string, unknown>,
	preview: EditPreview,
	argsKey: string | undefined,
): boolean {
	const current = state["preview"];
	if (current === undefined) {
		state["preview"] = preview;
		state["previewArgsKey"] = argsKey;
		state["previewPending"] = false;
		return true;
	}
	const currentRecord = previewRecordOf(current as EditPreview);
	const previewRecord = previewRecordOf(preview);
	const currentError = currentRecord["error"] as string | undefined;
	const newError = previewRecord["error"] as string | undefined;
	const currentDiff = currentRecord["diff"] as string | undefined;
	const newDiff = previewRecord["diff"] as string | undefined;
	const currentFirst = currentRecord["firstChangedLine"] as number | undefined;
	const newFirst = previewRecord["firstChangedLine"] as number | undefined;
	const currentHasError = currentError !== undefined;
	const previewIsError = newError !== undefined;
	let changed: boolean;
	if (currentHasError && previewIsError) {
		changed = currentError !== newError;
	} else if (currentHasError !== previewIsError) {
		changed = true;
	} else {
		changed = currentDiff !== newDiff || currentFirst !== newFirst;
	}
	state["preview"] = preview;
	state["previewArgsKey"] = argsKey;
	state["previewPending"] = false;
	return changed;
}

export function createEditToolDefinition(cwd: string, options?: EditToolOptions): ToolDefinition<typeof editSchema> {
	const ops = options?.operations ?? defaultEditOperations;
	return {
		name: "edit",
		label: "edit",
		description:
			"Edit a single file using exact text replacement. Every edits[].oldText must match a unique, non-overlapping region of the original file. If two changes affect the same block or nearby lines, merge them into one edit instead of emitting overlapping edits. Do not include large unchanged regions just to connect distant changes.",
		promptSnippet: editToolSystemPromptContribution.snippet,
		promptGuidelines: editToolSystemPromptContribution.guidelines.slice(),
		parameters: editSchema,
		constrainedSampling: getExperimentalToolSampling(),
		renderShell: "self",
		prepareArguments: prepareEditArguments,
		async execute(_toolCallId, input: unknown, signal, _onUpdate): Promise<AgentToolResult<unknown>> {
			const { path, edits } = validateEditInput(input as EditToolInput);
			const absolutePath = resolveToCwd(path, cwd);

			return withFileMutationQueue(absolutePath, async () => {
				// Do not reject from an abort event listener here: that would release the
				// mutation queue while an in-flight filesystem operation may still finish.
				// Checking signal.aborted after each await observes the same aborts while
				// keeping the queue locked until the current operation has settled.
				const throwIfAborted = (): void => {
					if (signal?.aborted) throw new Error("Operation aborted");
				};

				throwIfAborted();

				// Check if file exists.
				try {
					await ops.access(absolutePath);
				} catch (error: unknown) {
					throwIfAborted();
					let errorMessage: string;
					if (error instanceof Error) {
						const code = errorCodeOf(error);
						errorMessage = code !== undefined ? `Error code: ${code}` : error.message;
					} else {
						errorMessage = JSON.stringify(error);
					}
					throw new Error(`Could not edit file: ${path}. ${errorMessage}.`);
				}
				throwIfAborted();

				// Read the file.
				const buffer = await ops.readFile(absolutePath);
				const rawContent = buffer.toString("utf-8");
				throwIfAborted();

				// Strip BOM before matching. The model will not include an invisible BOM in oldText.
				const { bom, text: content } = splitBom(rawContent);
				const originalEnding = detectLineEnding(content);
				const normalizedContent = normalizeToLF(content);
				const { baseContent, newContent } = applyEditsToNormalizedContent(normalizedContent, edits, path);
				throwIfAborted();

				const finalContent = bom + restoreLineEndings(newContent, originalEnding);
				await ops.writeFile(absolutePath, finalContent);
				throwIfAborted();

				const diffResult = generateDiffString(baseContent, newContent);
				const patch = generateUnifiedPatch(path, baseContent, newContent);
				const result: AgentToolResult<unknown> = {
					content: [
						{
							type: "text",
							text: `Successfully replaced ${edits.length} block(s) in ${path}.`,
						},
					],
					details: { diff: diffResult.diff, patch, firstChangedLine: diffResult.firstChangedLine },
				};
				return result;
			});
		},
		renderCall(args, theme, context) {
			const stateView = editStateOf(context.state);
			const previewInput = getRenderablePreviewInput(args as RenderableEditArgs | undefined);
			const argsKey = previewInput
				? JSON.stringify({ path: previewInput.path, edits: previewInput.edits })
				: undefined;

			const currentArgsKey = stateView["previewArgsKey"] as string | undefined;
			if (currentArgsKey !== argsKey) {
				resetEditState(context.state, argsKey);
			}

			const currentPreview = stateView["preview"] as EditPreview | undefined;
			const pendingFlag = stateView["previewPending"] as boolean | undefined;
			if (context.argsComplete && previewInput && currentPreview === undefined && pendingFlag !== true) {
				markPreviewPending(context.state);
				const requestKey = argsKey;
				void computeEditsDiff(previewInput.path, previewInput.edits, context.cwd).then((preview) => {
					const latestArgsKey = editStateOf(context.state)["previewArgsKey"] as string | undefined;
					if (latestArgsKey === requestKey) {
						setEditPreviewState(context.state, preview, requestKey);
						context.invalidate();
					}
				});
			}

			const component = new EditCallRenderComponent();
			component.preview = editStateOf(context.state)["preview"] as EditPreview | undefined;
			component.settledError = stateView["settledError"] === true;
			return buildEditCallComponent(
				component,
				args as RenderableEditArgs | undefined,
				theme,
				context.cwd,
			) as Component;
		},
		renderResult(result, _options, _theme, context) {
			const stateView = editStateOf(context.state);
			const previewInput = getRenderablePreviewInput(context.args as RenderableEditArgs | undefined);
			const argsKey = previewInput
				? JSON.stringify({ path: previewInput.path, edits: previewInput.edits })
				: undefined;
			const typedDetails = editDetailsOf(result.details);
			const resultDiff = !context.isError ? typedDetails?.diff : undefined;
			const resultPreview: EditPreview | undefined =
				typeof resultDiff === "string"
					? { diff: resultDiff, firstChangedLine: typedDetails?.firstChangedLine }
					: undefined;
			let changed = false;
			if (resultPreview !== undefined) {
				if (setEditPreviewState(context.state, resultPreview, argsKey)) {
					changed = true;
				}
			}
			if (stateView["settledError"] !== context.isError) {
				writeSettledError(context.state, context.isError);
				changed = true;
			}
			if (changed) {
				context.invalidate();
			}

			const activePreview =
				resultPreview !== undefined ? resultPreview : (stateView["preview"] as EditPreview | undefined);
			const output = formatEditResult(
				context.args as RenderableEditArgs | undefined,
				activePreview,
				{ content: result.content, details: typedDetails },
				_theme,
				context.isError,
			);
			const component = new Container();
			component.clear();
			if (!output) {
				return component as Component;
			}
			component.addChild(new Spacer(1));
			component.addChild(new Text(output, 1, 0));
			return component as Component;
		},
	};
}

export function createEditTool(cwd: string, options?: EditToolOptions): AgentTool<typeof editSchema> {
	return wrapToolDefinition(createEditToolDefinition(cwd, options));
}
