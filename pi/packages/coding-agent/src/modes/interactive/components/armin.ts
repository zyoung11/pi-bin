/**
 * Armin says hi! A fun easter egg with animated XBM art.
 */

import { Component, type TUI } from "../../../../../tui/src/tui.ts";
import { theme } from "../theme/theme.ts";

// XBM image: 31x36 pixels, LSB first, 1=background, 0=foreground
const WIDTH = 31;
const HEIGHT = 36;
const BITS = [
	0xff, 0xff, 0xff, 0x7f, 0xff, 0xf0, 0xff, 0x7f, 0xff, 0xed, 0xff, 0x7f, 0xff, 0xdb, 0xff, 0x7f, 0xff, 0xb7, 0xff,
	0x7f, 0xff, 0x77, 0xfe, 0x7f, 0x3f, 0xf8, 0xfe, 0x7f, 0xdf, 0xff, 0xfe, 0x7f, 0xdf, 0x3f, 0xfc, 0x7f, 0x9f, 0xc3,
	0xfb, 0x7f, 0x6f, 0xfc, 0xf4, 0x7f, 0xf7, 0x0f, 0xf7, 0x7f, 0xf7, 0xff, 0xf7, 0x7f, 0xf7, 0xff, 0xe3, 0x7f, 0xf7,
	0x07, 0xe8, 0x7f, 0xef, 0xf8, 0x67, 0x70, 0x0f, 0xff, 0xbb, 0x6f, 0xf1, 0x00, 0xd0, 0x5b, 0xfd, 0x3f, 0xec, 0x53,
	0xc1, 0xff, 0xef, 0x57, 0x9f, 0xfd, 0xee, 0x5f, 0x9f, 0xfc, 0xae, 0x5f, 0x1f, 0x78, 0xac, 0x5f, 0x3f, 0x00, 0x50,
	0x6c, 0x7f, 0x00, 0xdc, 0x77, 0xff, 0xc0, 0x3f, 0x78, 0xff, 0x01, 0xf8, 0x7f, 0xff, 0x03, 0x9c, 0x78, 0xff, 0x07,
	0x8c, 0x7c, 0xff, 0x0f, 0xce, 0x78, 0xff, 0xff, 0xcf, 0x7f, 0xff, 0xff, 0xcf, 0x78, 0xff, 0xff, 0xdf, 0x78, 0xff,
	0xff, 0xdf, 0x7d, 0xff, 0xff, 0x3f, 0x7e, 0xff, 0xff, 0xff, 0x7f,
];

const BYTES_PER_ROW = Math.ceil(WIDTH / 8);
const DISPLAY_HEIGHT = Math.ceil(HEIGHT / 2); // Half-block rendering

type Effect = "typewriter" | "scanline" | "rain" | "fade" | "crt" | "glitch" | "dissolve";

const EFFECTS: Effect[] = ["typewriter", "scanline", "rain", "fade", "crt", "glitch", "dissolve"];

// Get pixel at (x, y): true = foreground, false = background
function getPixel(x: number, y: number): boolean {
	if (y >= HEIGHT) return false;
	const byteIndex = y * BYTES_PER_ROW + Math.floor(x / 8);
	const bitIndex = x % 8;
	return ((BITS[byteIndex] >> bitIndex) & 1) === 0;
}

// Get the character for a cell (2 vertical pixels packed)
function getChar(x: number, row: number): string {
	const upper = getPixel(x, row * 2);
	const lower = getPixel(x, row * 2 + 1);
	if (upper && lower) return "█";
	if (upper) return "▀";
	if (lower) return "▄";
	return " ";
}

// Build the final image grid
function buildFinalGrid(): string[][] {
	const grid: string[][] = [];
	for (let row = 0; row < DISPLAY_HEIGHT; row++) {
		const line: string[] = [];
		for (let x = 0; x < WIDTH; x++) {
			line.push(getChar(x, row));
		}
		grid.push(line);
	}
	return grid;
}

function shuffledPositions(): number[][] {
	const positions: number[][] = [];
	for (let row = 0; row < DISPLAY_HEIGHT; row++) {
		for (let x = 0; x < WIDTH; x++) {
			positions.push([row, x]);
		}
	}
	for (let i = positions.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = positions[i];
		positions[i] = positions[j];
		positions[j] = tmp;
	}
	return positions;
}

export class ArminComponent extends Component {
	private ui: TUI;
	private interval: ReturnType<typeof setInterval> | null = null;
	private effect: Effect;
	private finalGrid: string[][];
	private currentGrid: string[][];
	private effectState: Record<string, unknown> = {};
	private cachedLines: string[] = [];
	private cachedWidth = 0;
	private gridVersion = 0;
	private cachedVersion = -1;

	constructor(ui: TUI) {
		super();
		this.ui = ui;
		this.effect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
		this.finalGrid = buildFinalGrid();
		this.currentGrid = this.createEmptyGrid();

		this.initEffect();
		this.startAnimation();
	}

	invalidate(): void {
		this.cachedWidth = 0;
	}

	render(width: number): string[] {
		if (width === this.cachedWidth && this.cachedVersion === this.gridVersion) {
			return this.cachedLines;
		}

		const padding = 1;
		const availableWidth = width - padding;

		this.cachedLines = this.currentGrid.map((row) => {
			// Clip row to available width before applying color
			const clipped = row.slice(0, availableWidth).join("");
			const padRight = Math.max(0, width - padding - clipped.length);
			return ` ${theme.fg("accent", clipped)}${" ".repeat(padRight)}`;
		});

		// Add "ARMIN SAYS HI" at the end
		const message = "ARMIN SAYS HI";
		const msgPadRight = Math.max(0, width - padding - message.length);
		this.cachedLines.push(` ${theme.fg("accent", message)}${" ".repeat(msgPadRight)}`);

		this.cachedWidth = width;
		this.cachedVersion = this.gridVersion;

		return this.cachedLines;
	}

	private createEmptyGrid(): string[][] {
		const grid: string[][] = [];
		for (let row = 0; row < DISPLAY_HEIGHT; row++) {
			const line: string[] = [];
			for (let x = 0; x < WIDTH; x++) line.push(" ");
			grid.push(line);
		}
		return grid;
	}

	private initEffect(): void {
		switch (this.effect) {
			case "typewriter":
				this.effectState = { pos: 0 };
				break;
			case "scanline":
				this.effectState = { row: 0 };
				break;
			case "rain": {
				const dropsY: number[] = [];
				const dropsSettled: number[] = [];
				for (let x = 0; x < WIDTH; x++) {
					dropsY.push(-Math.floor(Math.random() * DISPLAY_HEIGHT * 2));
					dropsSettled.push(0);
				}
				this.effectState = { dropsY, dropsSettled };
				break;
			}
			case "fade":
				this.effectState = { positions: shuffledPositions(), idx: 0 };
				break;
			case "crt":
				this.effectState = { expansion: 0 };
				break;
			case "glitch":
				this.effectState = { phase: 0, glitchFrames: 8 };
				break;
			case "dissolve": {
				const noiseChars = [" ", "░", "▒", "▓", "█", "▀", "▄"];
				const noise = this.createEmptyGrid();
				for (let row = 0; row < DISPLAY_HEIGHT; row++) {
					for (let x = 0; x < WIDTH; x++) {
						noise[row][x] = noiseChars[Math.floor(Math.random() * noiseChars.length)];
					}
				}
				this.currentGrid = noise;
				this.effectState = { positions: shuffledPositions(), idx: 0 };
				break;
			}
		}
	}

	private startAnimation(): void {
		const fps = this.effect === "glitch" ? 60 : 30;
		this.interval = setInterval(() => {
			const done = this.tickEffect();
			this.updateDisplay();
			this.ui.requestRender();
			if (done) {
				this.stopAnimation();
			}
		}, 1000 / fps);
	}

	private stopAnimation(): void {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	private tickEffect(): boolean {
		switch (this.effect) {
			case "typewriter":
				return this.tickTypewriter();
			case "scanline":
				return this.tickScanline();
			case "rain":
				return this.tickRain();
			case "fade":
				return this.tickFade();
			case "crt":
				return this.tickCrt();
			case "glitch":
				return this.tickGlitch();
			case "dissolve":
				return this.tickDissolve();
			default:
				return true;
		}
	}

	private tickTypewriter(): boolean {
		const posValue = this.effectState["pos"];
		const startPos = typeof posValue === "number" ? posValue : 0;
		const pixelsPerFrame = 3;

		for (let i = 0; i < pixelsPerFrame; i++) {
			const pos = startPos + i;
			const row = Math.floor(pos / WIDTH);
			const x = pos % WIDTH;
			if (row >= DISPLAY_HEIGHT) return true;
			this.currentGrid[row][x] = this.finalGrid[row][x];
		}
		this.effectState["pos"] = startPos + pixelsPerFrame;
		return false;
	}

	private tickScanline(): boolean {
		const rowValue = this.effectState["row"];
		const row = typeof rowValue === "number" ? rowValue : DISPLAY_HEIGHT;
		if (row >= DISPLAY_HEIGHT) return true;

		for (let x = 0; x < WIDTH; x++) {
			this.currentGrid[row][x] = this.finalGrid[row][x];
		}
		this.effectState["row"] = row + 1;
		return false;
	}

	private tickRain(): boolean {
		const dropsYValue = this.effectState["dropsY"];
		const dropsSettledValue = this.effectState["dropsSettled"];
		if (!Array.isArray(dropsYValue) || !Array.isArray(dropsSettledValue)) return true;
		const dropsY = dropsYValue as number[];
		const dropsSettled = dropsSettledValue as number[];

		let allSettled = true;
		this.currentGrid = this.createEmptyGrid();

		for (let x = 0; x < WIDTH; x++) {
			const settled = dropsSettled[x] ?? 0;

			for (let row = DISPLAY_HEIGHT - 1; row >= DISPLAY_HEIGHT - settled; row--) {
				if (row >= 0) {
					this.currentGrid[row][x] = this.finalGrid[row][x];
				}
			}

			if (settled >= DISPLAY_HEIGHT) continue;

			allSettled = false;

			let targetRow = -1;
			for (let row = DISPLAY_HEIGHT - 1 - settled; row >= 0; row--) {
				if (this.finalGrid[row][x] !== " ") {
					targetRow = row;
					break;
				}
			}

			let y = dropsY[x] ?? 0;
			y++;

			if (y >= 0 && y < DISPLAY_HEIGHT) {
				if (targetRow >= 0 && y >= targetRow) {
					dropsSettled[x] = DISPLAY_HEIGHT - targetRow;
					dropsY[x] = -Math.floor(Math.random() * 5) - 1;
				} else {
					this.currentGrid[y][x] = "\u2593";
				}
			} else {
				dropsY[x] = y;
			}
		}

		return allSettled;
	}

	private tickFade(): boolean {
		const positionsValue = this.effectState["positions"];
		const idxValue = this.effectState["idx"];
		if (!Array.isArray(positionsValue)) return true;
		const positions = positionsValue as number[][];
		let idx = typeof idxValue === "number" ? idxValue : 0;
		const pixelsPerFrame = 15;

		for (let i = 0; i < pixelsPerFrame; i++) {
			if (idx >= positions.length) return true;
			const pair = positions[idx];
			const row = pair[0] ?? 0;
			const x = pair[1] ?? 0;
			this.currentGrid[row][x] = this.finalGrid[row][x];
			idx++;
		}
		this.effectState["idx"] = idx;
		return false;
	}

	private tickCrt(): boolean {
		const expansionValue = this.effectState["expansion"];
		const expansion = typeof expansionValue === "number" ? expansionValue : 0;
		const midRow = Math.floor(DISPLAY_HEIGHT / 2);

		this.currentGrid = this.createEmptyGrid();

		const top = midRow - expansion;
		const bottom = midRow + expansion;

		for (let row = Math.max(0, top); row <= Math.min(DISPLAY_HEIGHT - 1, bottom); row++) {
			for (let x = 0; x < WIDTH; x++) {
				this.currentGrid[row][x] = this.finalGrid[row][x];
			}
		}

		this.effectState["expansion"] = expansion + 1;
		return expansion + 1 > DISPLAY_HEIGHT;
	}

	private tickGlitch(): boolean {
		const phaseValue = this.effectState["phase"];
		const framesValue = this.effectState["glitchFrames"];
		const phase = typeof phaseValue === "number" ? phaseValue : 0;
		const glitchFrames = typeof framesValue === "number" ? framesValue : 8;

		if (phase < glitchFrames) {
			const corrupted: string[][] = [];
			for (const row of this.finalGrid) {
				const glitchRow = [...row];
				const offset = Math.floor(Math.random() * 7) - 3;
				if (Math.random() < 0.3) {
					const shifted = glitchRow.slice(offset).concat(glitchRow.slice(0, offset));
					corrupted.push(shifted.slice(0, WIDTH));
					continue;
				}
				if (Math.random() < 0.2) {
					const swapRow = Math.floor(Math.random() * DISPLAY_HEIGHT);
					const source = this.finalGrid[swapRow];
					if (source !== undefined) {
						corrupted.push([...source]);
						continue;
					}
				}
				corrupted.push(glitchRow);
			}
			this.currentGrid = corrupted;
			this.effectState["phase"] = phase + 1;
			return false;
		}

		const clean: string[][] = [];
		for (const row of this.finalGrid) clean.push([...row]);
		this.currentGrid = clean;
		return true;
	}

	private tickDissolve(): boolean {
		const positionsValue = this.effectState["positions"];
		const idxValue = this.effectState["idx"];
		if (!Array.isArray(positionsValue)) return true;
		const positions = positionsValue as number[][];
		let idx = typeof idxValue === "number" ? idxValue : 0;
		const pixelsPerFrame = 20;

		for (let i = 0; i < pixelsPerFrame; i++) {
			if (idx >= positions.length) return true;
			const pair = positions[idx];
			const row = pair[0] ?? 0;
			const x = pair[1] ?? 0;
			this.currentGrid[row][x] = this.finalGrid[row][x];
			idx++;
		}
		this.effectState["idx"] = idx;
		return false;
	}

	private updateDisplay(): void {
		this.gridVersion++;
	}

	dispose(): void {
		this.stopAnimation();
	}
}
