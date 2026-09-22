import type { AssistantMessage } from "../../../../../ai/src/index.ts";
import { Markdown, type MarkdownTheme } from "../../../../../tui/src/components/markdown.ts";
import { Spacer } from "../../../../../tui/src/components/spacer.ts";
import { Text } from "../../../../../tui/src/components/text.ts";
import { type Component, Container } from "../../../../../tui/src/tui.ts";
import { getMarkdownTheme, theme } from "../theme/theme.ts";
import type { MarkdownTransformer } from "./markdown-transform.ts";
import { createMarkdownTransform } from "./markdown-transform.ts";

const OSC133_ZONE_START = "\x1b]133;A\x07";
const OSC133_ZONE_END = "\x1b]133;B\x07";
const OSC133_ZONE_FINAL = "\x1b]133;C\x07";
const MARKDOWN_CHUNK_MIN_LINES = 120;

/**
 * Split markdown source into stable chunks at blank-line boundaries that fall
 * outside fenced code and are not adjacent to indented code, list items or html
 * blocks. The separating blank lines stay at the start of the next chunk, so the
 * concatenation of the chunk renders equals the render of the whole source and a
 * streamed text block only re-parses its growing tail chunk.
 * @param text Markdown source
 * @returns Chunk sources in order whose concatenation reproduces the input
 */
export function splitMarkdownChunks(text: string): string[] {
	const lines = text.split("\n");
	const chunks: string[] = [];
	let fenceChar = "";
	let fenceLength = 0;
	let chunkStart = 0;
	let chunkLines = 0;
	let index = 0;
	while (index < lines.length) {
		const line = lines[index];
		if (fenceChar !== "") {
			const closeMatch = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
			if (closeMatch && closeMatch[1][0] === fenceChar && closeMatch[1].length >= fenceLength) {
				fenceChar = "";
				fenceLength = 0;
			}
			index++;
			chunkLines++;
			continue;
		}
		const openMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);
		if (openMatch) {
			fenceChar = openMatch[1][0];
			fenceLength = openMatch[1].length;
			index++;
			chunkLines++;
			continue;
		}
		if (line.trim() !== "") {
			index++;
			chunkLines++;
			continue;
		}
		let runEnd = index;
		while (runEnd < lines.length && lines[runEnd].trim() === "") runEnd++;
		const runLength = runEnd - index;
		const previous = index > 0 ? lines[index - 1] : "";
		const next = runEnd < lines.length ? lines[runEnd] : undefined;
		const boundarySafe =
			next !== undefined &&
			chunkLines >= MARKDOWN_CHUNK_MIN_LINES &&
			!/^(?: {4}|\t)/.test(previous) &&
			!/^(?: {4}|\t)/.test(next) &&
			!/^\s*(?:[-*+]|\d+[.)])(?:\s|$)/.test(previous) &&
			!/^\s*(?:[-*+]|\d+[.)])(?:\s|$)/.test(next) &&
			!/^</.test(next.trimStart());
		if (boundarySafe) {
			chunks.push(lines.slice(chunkStart, index).join("\n"));
			chunkStart = index;
			chunkLines = 0;
		}
		index = runEnd;
		chunkLines += runLength;
	}
	chunks.push(lines.slice(chunkStart).join("\n"));
	return chunks;
}

/**
 * Component that renders a complete assistant message
 */
export class AssistantMessageComponent extends Container {
	private contentContainer: Container;
	private hideThinkingBlock: boolean;
	private markdownTheme: MarkdownTheme;
	private hiddenThinkingLabel: string;
	private outputPad: number;
	private markdownTransformers: readonly MarkdownTransformer[];
	private lastMessage?: AssistantMessage;
	private hasToolCalls = false;
	private isStreaming = false;
	private builtBlockKinds: string[];
	private builtBlockChunks: string[];
	private builtBlockComponents: Component[];
	private builtBlockOptions: string;

	constructor(
		message?: AssistantMessage,
		hideThinkingBlock = false,
		markdownTheme: MarkdownTheme = getMarkdownTheme(),
		hiddenThinkingLabel = "Thinking...",
		outputPad = 1,
		markdownTransformers: readonly MarkdownTransformer[] = [],
	) {
		super();

		this.hideThinkingBlock = hideThinkingBlock;
		this.markdownTheme = markdownTheme;
		this.hiddenThinkingLabel = hiddenThinkingLabel;
		this.outputPad = outputPad;
		this.markdownTransformers = markdownTransformers;
		this.builtBlockKinds = [];
		this.builtBlockChunks = [];
		this.builtBlockComponents = [];
		this.builtBlockOptions = "";

		// Container for text/thinking content
		this.contentContainer = new Container();
		this.addChild(this.contentContainer);

		if (message) {
			this.updateContent(message);
		}
	}

	/**
	 * Content changes flow through explicit setters that rebuild the display;
	 * invalidation only needs to clear child caches, which the markdown render
	 * epoch and per-component cache keys already handle.
	 */
	override invalidate(): void {
		super.invalidate();
	}

	setHideThinkingBlock(hide: boolean): void {
		this.hideThinkingBlock = hide;
		if (this.lastMessage) {
			this.updateContent(this.lastMessage);
		}
	}

	setHiddenThinkingLabel(label: string): void {
		this.hiddenThinkingLabel = label;
		if (this.lastMessage) {
			this.updateContent(this.lastMessage);
		}
	}

	setOutputPad(padding: number): void {
		this.outputPad = padding;
		if (this.lastMessage) {
			this.updateContent(this.lastMessage);
		}
	}

	override render(width: number): string[] {
		const lines = super.render(width);
		if (this.hasToolCalls || lines.length === 0) {
			return lines;
		}

		lines[0] = OSC133_ZONE_START + lines[0];
		lines[lines.length - 1] = OSC133_ZONE_END + OSC133_ZONE_FINAL + lines[lines.length - 1];
		return lines;
	}

	/**
	 * Look up the component built for the same chunk at the same position in the
	 * previous update. The chunk strings are compared by value and shared with
	 * the retained components, so the bookkeeping holds no second copy of the
	 * message text.
	 * @param index Position of the block in the build order
	 * @param kind Block kind of the block
	 * @param chunk Chunk source of the block
	 * @returns The previously built component, or undefined when it must rebuild
	 */
	private takeReusedBlock(index: number, kind: string, chunk: string): Component | undefined {
		if (index >= this.builtBlockKinds.length || index >= this.builtBlockComponents.length) return undefined;
		if (this.builtBlockKinds[index] !== kind) return undefined;
		if (this.builtBlockChunks[index] !== chunk) return undefined;
		return this.builtBlockComponents[index];
	}

	/**
	 * Append one markdown source as stable chunks, reusing the component built
	 * for the same chunk key at the same position. Streamed updates only grow the
	 * tail chunk, so every earlier chunk keeps its cached render output.
	 * @param source Markdown source of the section
	 * @param kind Block kind included in the cache key
	 * @param thinking Whether the section renders as thinking text
	 * @param keys Cache keys in build order, appended to in place
	 * @param built Components in build order, appended to in place
	 */
	private addMarkdownBlocks(
		source: string,
		kind: string,
		kinds: string[],
		chunks: string[],
		built: Component[],
	): void {
		const sourceChunks = splitMarkdownChunks(source);
		for (let c = 0; c < sourceChunks.length; c++) {
			const chunk = sourceChunks[c];
			const index = kinds.length;
			kinds.push(kind);
			chunks.push(chunk);
			let component = this.takeReusedBlock(index, kind, chunk);
			if (component === undefined) {
				if (kind === "thinking") {
					component = new Markdown(
						chunk,
						this.outputPad,
						0,
						this.markdownTheme,
						{
							color: (text: string) => theme.fg("thinkingText", text),
							italic: true,
						},
						{
							transform: createMarkdownTransform(
								"assistant-thinking",
								this.isStreaming,
								this.markdownTransformers,
							),
						},
					);
				} else {
					component = new Markdown(chunk, this.outputPad, 0, this.markdownTheme, undefined, {
						transform: createMarkdownTransform("assistant", this.isStreaming, this.markdownTransformers),
					});
				}
			}
			built.push(component);
			this.contentContainer.addChild(component);
		}
	}

	/**
	 * Rebuild the display from the message. Streamed updates only re-parse the
	 * growing tail chunk of each markdown section while every earlier chunk and
	 * every unchanged block reuses its component and keeps its cached lines.
	 * @param message The latest message state
	 * @param isStreaming Whether the message is still streaming
	 */
	updateContent(message: AssistantMessage, isStreaming = this.isStreaming): void {
		this.lastMessage = message;
		this.isStreaming = isStreaming;

		// Clear content container
		this.contentContainer.clear();

		const hasVisibleContent = message.content.some(
			(c) => (c.type === "text" && c.text.trim()) || (c.type === "thinking" && c.thinking.trim()),
		);

		if (hasVisibleContent) {
			this.contentContainer.addChild(new Spacer(1));
		}

		const options = `${this.outputPad}|${this.isStreaming ? "1" : "0"}|${this.hideThinkingBlock ? "1" : "0"}|${this.hiddenThinkingLabel}`;
		if (options !== this.builtBlockOptions) {
			this.builtBlockOptions = options;
			this.builtBlockKinds = [];
			this.builtBlockChunks = [];
			this.builtBlockComponents = [];
		}
		const kinds: string[] = [];
		const chunks: string[] = [];
		const built: Component[] = [];

		// Render content in order
		for (let i = 0; i < message.content.length; i++) {
			const content = message.content[i];
			if (content.type === "text" && content.text.trim()) {
				this.addMarkdownBlocks(content.text.trim(), "text", kinds, chunks, built);
			} else if (content.type === "thinking") {
				const thinkingBlocks: string[] = [];
				for (; i < message.content.length; i++) {
					const thinkingContent = message.content[i];
					if (thinkingContent.type !== "thinking") {
						break;
					}
					const thinking = thinkingContent.thinking.trim();
					if (thinking) {
						thinkingBlocks.push(thinking);
					}
				}
				i--;

				if (thinkingBlocks.length === 0) {
					continue;
				}

				// Add spacing only when another visible assistant content block follows.
				// This avoids a superfluous blank line before separately-rendered tool execution blocks.
				const hasVisibleContentAfter = message.content
					.slice(i + 1)
					.some((c) => (c.type === "text" && c.text.trim()) || (c.type === "thinking" && c.thinking.trim()));

				if (this.hideThinkingBlock) {
					const labelIndex = kinds.length;
					kinds.push("label");
					chunks.push(this.hiddenThinkingLabel);
					let label = this.takeReusedBlock(labelIndex, "label", this.hiddenThinkingLabel);
					if (label === undefined) {
						label = new Text(theme.italic(theme.fg("thinkingText", this.hiddenThinkingLabel)), this.outputPad, 0);
					}
					built.push(label);
					this.contentContainer.addChild(label);
				} else {
					this.addMarkdownBlocks(thinkingBlocks.join("\n\n"), "thinking", kinds, chunks, built);
				}
				if (hasVisibleContentAfter) {
					this.contentContainer.addChild(new Spacer(1));
				}
			}
		}
		this.builtBlockKinds = kinds;
		this.builtBlockChunks = chunks;
		this.builtBlockComponents = built;

		// Check if incomplete/failed - show after partial content.
		// For aborted/error tool calls, tool execution components show the error.
		// Length stops can happen before a tool call is complete, so surface them here too.
		const hasToolCalls = message.content.some((c) => c.type === "toolCall");
		this.hasToolCalls = hasToolCalls;
		if (message.stopReason === "length") {
			this.contentContainer.addChild(new Spacer(1));
			this.contentContainer.addChild(
				new Text(theme.fg("error", "Response was truncated before completion."), this.outputPad, 0),
			);
		} else if (!hasToolCalls) {
			if (message.stopReason === "aborted") {
				const abortMessage =
					message.errorMessage && message.errorMessage !== "Request was aborted"
						? message.errorMessage
						: "Operation aborted";
				this.contentContainer.addChild(new Spacer(1));
				this.contentContainer.addChild(new Text(theme.fg("error", abortMessage), this.outputPad, 0));
			} else if (message.stopReason === "error") {
				const errorMsg = message.errorMessage || "Unknown error";
				this.contentContainer.addChild(new Spacer(1));
				this.contentContainer.addChild(new Text(theme.fg("error", `Error: ${errorMsg}`), this.outputPad, 0));
			}
		}
	}
}
