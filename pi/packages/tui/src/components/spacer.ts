import { Component } from "../tui.ts";

/**
 * Spacer component that renders empty lines
 */
export class Spacer extends Component {
	private lines: number;

	constructor(lines: number = 1) {
		super();
		this.lines = lines;
	}

	setLines(lines: number): void {
		if (this.lines === lines) return;
		this.lines = lines;
		this.markContentChanged();
	}

	invalidate(): void {
		// No cached state to invalidate currently
	}

	measure(_width: number): number {
		return this.lines;
	}

	render(_width: number): string[] {
		const result: string[] = [];
		for (let i = 0; i < this.lines; i++) {
			result.push("");
		}
		return result;
	}
}
