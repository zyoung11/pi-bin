import { parse } from "../../../ai/src/utils/mini-yaml.ts";
import { stripBom } from "./text.ts";

/** View an arbitrary value as a plain record (jsval unions resist casts). */
function recordOf(value: unknown): Record<string, unknown> {
	return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

type ParsedFrontmatter<T extends Record<string, unknown>> = {
	frontmatter: T;
	body: string;
};

const normalizeNewlines = (value: string): string => value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

const extractFrontmatter = (content: string): { yamlString: string | null; body: string } => {
	const normalized = normalizeNewlines(stripBom(content));

	if (!normalized.startsWith("---")) {
		return { yamlString: null, body: normalized };
	}

	const endIndex = normalized.indexOf("\n---", 3);
	if (endIndex === -1) {
		return { yamlString: null, body: normalized };
	}

	return {
		yamlString: normalized.slice(4, endIndex),
		body: normalized.slice(endIndex + 4).trim(),
	};
};

export function parseFrontmatter<T extends Record<string, unknown> = Record<string, unknown>>(
	content: string,
): ParsedFrontmatter<T> {
	const extracted = extractFrontmatter(content);
	const yamlString = extracted.yamlString;
	if (!yamlString) {
		return { frontmatter: {} as T, body: extracted.body };
	}
	const raw = parse(yamlString);
	const parsed = raw === undefined || raw === null ? undefined : (recordOf(raw) as Record<string, unknown>);
	const frontmatter = parsed === undefined ? ({} as T) : (parsed as T);
	return { frontmatter, body: extracted.body };
}

export const stripFrontmatter = (content: string): string => parseFrontmatter(content).body;
