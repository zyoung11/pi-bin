/**
 * Minimal chalk-compatible terminal styler covering the subset of chalk APIs this codebase uses
 * (red/dim/yellow/bold/green/strikethrough/underline/italic/cyan/inverse), with color-level
 * detection matching chalk's defaults: NO_COLOR, FORCE_COLOR, dumb terminals and non-TTY stdout
 * disable styling.
 */

const FORCE_COLOR = process.env.FORCE_COLOR;
const NO_COLOR = process.env.NO_COLOR;
const TERM = process.env.TERM;

const level: number =
	NO_COLOR !== undefined || FORCE_COLOR === "0" || TERM === "dumb"
		? 0
		: FORCE_COLOR === "1"
			? 1
			: process.stdout.isTTY || FORCE_COLOR !== undefined
				? 2
				: 0;

interface Style {
	open: string;
	close: string;
}

const STYLES: Record<string, Style> = {
	red: { open: "\x1B[31m", close: "\x1B[39m" },
	green: { open: "\x1B[32m", close: "\x1B[39m" },
	yellow: { open: "\x1B[33m", close: "\x1B[39m" },
	cyan: { open: "\x1B[36m", close: "\x1B[39m" },
	dim: { open: "\x1B[2m", close: "\x1B[22m" },
	bold: { open: "\x1B[1m", close: "\x1B[22m" },
	italic: { open: "\x1B[3m", close: "\x1B[23m" },
	underline: { open: "\x1B[4m", close: "\x1B[24m" },
	strikethrough: { open: "\x1B[9m", close: "\x1B[29m" },
	inverse: { open: "\x1B[7m", close: "\x1B[27m" },
};

function styler(style: Style, text: string): string {
	if (level === 0) return text;
	return `${style.open}${text}${style.close}`;
}

class Chalk {
	red(text: string): string {
		return styler(STYLES.red, text);
	}

	green(text: string): string {
		return styler(STYLES.green, text);
	}

	yellow(text: string): string {
		return styler(STYLES.yellow, text);
	}

	cyan(text: string): string {
		return styler(STYLES.cyan, text);
	}

	dim(text: string): string {
		return styler(STYLES.dim, text);
	}

	bold(text: string): string {
		return styler(STYLES.bold, text);
	}

	italic(text: string): string {
		return styler(STYLES.italic, text);
	}

	underline(text: string): string {
		return styler(STYLES.underline, text);
	}

	strikethrough(text: string): string {
		return styler(STYLES.strikethrough, text);
	}

	inverse(text: string): string {
		return styler(STYLES.inverse, text);
	}
}

const chalk = new Chalk();

export default chalk;
