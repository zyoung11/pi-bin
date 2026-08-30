import { parse } from "../../../ai/src/utils/mini-yaml.ts";
import { stripBom } from "./text.ts";
type ParsedFrontmatter<T extends Record<string, unknown>> = {
	frontmatter: T;
	body: string;
};

const normalizeNewlines = (value: string): string => value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

/** JSON.stringify via an unknown parameter (union args resist direct stringify). */
function stringifyUnknown(value: unknown): string {
	return JSON.stringify(value);
}

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
	const frontmatter = raw === undefined || raw === null ? ({} as T) : (JSON.parse(stringifyUnknown(raw)) as T);
	return { frontmatter, body: extracted.body };
}

export const stripFrontmatter = (content: string): string => parseFrontmatter(content).body;
