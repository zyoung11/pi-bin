import { Component } from "../tui.ts";
import { visibleWidth } from "../utils.ts";

type RenderCache = {
	childLines: string[];
	width: number;
	bgSample: string | undefined;
	lines: string[];
	generation: number;
};

/**
 * Box component - a container that applies padding and background to all children
 */
export class Box extends Component {
	children: Component[] = [];
	private paddingX: number;
	private paddingY: number;
	private bgFn?: (text: string) => string;

	// Cache for rendered output
	private cache?: RenderCache;
	private releasedHeight = -1;
	private releasedWidth = -1;
	private releasedGeneration = -1;
	private structureGeneration = 0;

	constructor(paddingX = 1, paddingY = 1, bgFn?: (text: string) => string) {
		super();
		this.paddingX = paddingX;
		this.paddingY = paddingY;
		this.bgFn = bgFn;
	}

	addChild(component: Component): void {
		this.children.push(component);
		this.invalidateCache();
	}

	removeChild(component: Component): void {
		const index = this.children.indexOf(component);
		if (index !== -1) {
			this.children.splice(index, 1);
			this.invalidateCache();
		}
	}

	clear(): void {
		this.children = [];
		this.invalidateCache();
	}

	setBgFn(bgFn?: (text: string) => string): void {
		this.bgFn = bgFn;
		// Don't invalidate here - we'll detect bgFn changes by sampling output
	}

	private invalidateCache(): void {
		this.cache = undefined;
		this.releasedHeight = -1;
		this.structureGeneration += 1;
		this.markContentChanged();
	}

	/**
	 * Content generation of this box and its children. Caches key on it instead
	 * of the global content revision, so an unrelated change elsewhere in the
	 * tree no longer forces released boxes above the window to re-render and
	 * re-parse their children on every frame.
	 */
	private contentGeneration(): number {
		let generation = this.structureGeneration;
		for (let i = 0; i < this.children.length; i++) {
			generation += this.children[i].contentVersion();
		}
		return generation;
	}

	measure(width: number): number {
		const generation = this.contentGeneration();
		const cache = this.cache;
		if (cache && cache.width === width && cache.generation === generation) return cache.lines.length;
		if (this.releasedHeight >= 0 && this.releasedWidth === width && this.releasedGeneration === generation) {
			return this.releasedHeight;
		}
		return this.render(width).length;
	}

	releaseLines(): void {
		const cache = this.cache;
		if (cache) {
			this.releasedHeight = cache.lines.length;
			this.releasedWidth = cache.width;
			this.releasedGeneration = cache.generation;
			this.cache = undefined;
		}
		for (const child of this.children) {
			child.releaseLines();
		}
	}

	private matchCache(width: number, childLines: string[], bgSample: string | undefined): boolean {
		const cache = this.cache;
		return (
			!!cache &&
			cache.width === width &&
			cache.bgSample === bgSample &&
			cache.childLines.length === childLines.length &&
			cache.childLines.every((line, i) => line === childLines[i])
		);
	}

	invalidate(): void {
		this.invalidateCache();
		for (const child of this.children) {
			child.invalidate();
		}
	}

	render(width: number): string[] {
		if (this.children.length === 0) {
			return [];
		}

		const contentWidth = Math.max(1, width - this.paddingX * 2);
		const leftPad = " ".repeat(this.paddingX);

		// Render all children
		const childLines: string[] = [];
		for (const child of this.children) {
			const lines = child.render(contentWidth);
			for (const line of lines) {
				childLines.push(leftPad + line);
			}
		}

		if (childLines.length === 0) {
			return [];
		}

		const activeBgFn = this.bgFn;
		const bgSample = activeBgFn !== undefined ? activeBgFn("test") : undefined;

		// Check cache validity
		if (this.matchCache(width, childLines, bgSample)) {
			return this.cache!.lines;
		}

		// Apply background and padding
		const result: string[] = [];

		// Top padding
		for (let i = 0; i < this.paddingY; i++) {
			result.push(this.applyBg("", width));
		}

		// Content
		for (const line of childLines) {
			result.push(this.applyBg(line, width));
		}

		// Bottom padding
		for (let i = 0; i < this.paddingY; i++) {
			result.push(this.applyBg("", width));
		}

		// Update cache
		this.cache = { childLines, width, bgSample, lines: result, generation: this.contentGeneration() };

		return result;
	}

	private applyBg(line: string, width: number): string {
		const visLen = visibleWidth(line);
		const padNeeded = Math.max(0, width - visLen);
		const padded = line + " ".repeat(padNeeded);
		const bgFn = this.bgFn;
		if (bgFn) {
			return bgFn(padded);
		}
		return padded;
	}
}
