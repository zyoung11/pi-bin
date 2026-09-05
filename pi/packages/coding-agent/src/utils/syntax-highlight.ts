/**
 * Syntax highlighting was cut in the statically compiled build (highlight.js is a minified npm
 * package that cannot compile statically and is peripheral to the TUI). The module keeps its API
 * surface so call sites and theme wiring stay unchanged; highlighting falls back to plain themed
 * text via supportsLanguage returning false.
 */

export type HighlightFormatter = (text: string) => string;

export type HighlightTheme = Partial<Record<string, HighlightFormatter>>;

export interface HighlightOptions {
	language?: string;
	ignoreIllegals?: boolean;
	theme?: HighlightTheme;
}

export function loadAllHighlightLanguages(): Promise<void> {
	return Promise.resolve();
}

export function renderHighlightedHtml(html: string, _theme: HighlightTheme = {}): string {
	return html;
}

export function highlight(code: string, _options: HighlightOptions = {}): string {
	return code;
}

export function supportsLanguage(_name: string): boolean {
	return false;
}
