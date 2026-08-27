/**
 * Minimal gitignore matcher covering the semantics this codebase uses: negation, directory-only
 * patterns, root anchoring, basename patterns at any depth, double-star globbing, character
 * classes and comments. Later rules win over earlier ones, matching the ignore package.
 */

interface IgnoreRule {
	negated: boolean;
	dirOnly: boolean;
	regex: RegExp;
}

function escapeRegExp(text: string): string {
	return text.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

function segmentToRegExpSource(segment: string): string {
	let out = "";
	let index = 0;
	while (index < segment.length) {
		const char = segment[index];
		if (char === "*") {
			out += "[^/]*";
			index += 1;
			continue;
		}
		if (char === "?") {
			out += "[^/]";
			index += 1;
			continue;
		}
		if (char === "[") {
			const end = segment.indexOf("]", index + 1);
			if (end > index + 1) {
				let body = segment.slice(index + 1, end);
				if (body.startsWith("!")) body = "^" + body.slice(1);
				out += "[" + body + "]";
				index = end + 1;
				continue;
			}
		}
		out += escapeRegExp(char);
		index += 1;
	}
	return out;
}

function ruleToRegExpSource(pattern: string, anchored: boolean): string {
	let body = pattern;
	let prefix = "";
	if (body === "**") return "^.*$";
	if (body.startsWith("**/")) {
		prefix += "(?:[^/]+/)*";
		body = body.slice(3);
	}
	const segments = body.split("/");
	let trailingAny = false;
	while (segments.length > 1 && segments[segments.length - 1] === "**") {
		segments.pop();
		trailingAny = true;
	}
	const parts: string[] = [];
	for (const segment of segments) {
		if (segment === "**") {
			parts.push("(?:[^/]+/)*[^/]+");
		} else {
			parts.push(segmentToRegExpSource(segment));
		}
	}
	let source = "^" + prefix + parts.join("/");
	if (trailingAny) source += "(?:/.*)?";
	source += "$";
	return source;
}

function parseRule(rawLine: string): IgnoreRule | undefined {
	let line = rawLine.replace(/[ \t]+$/, "");
	if (line === "" || line.startsWith("#")) return undefined;
	let negated = false;
	if (line.startsWith("!")) {
		negated = true;
		line = line.slice(1);
	}
	if (line === "") return undefined;
	let dirOnly = false;
	while (line.endsWith("/")) {
		dirOnly = true;
		line = line.slice(0, -1);
	}
	if (line === "") return undefined;
	let anchored = false;
	if (line.startsWith("/")) {
		anchored = true;
		line = line.slice(1);
	} else if (line.slice(0, -1).includes("/")) {
		anchored = true;
	}
	if (line === "") return undefined;
	const source = (anchored ? "^" : "^(?:[^/]+/)*") + ruleToRegExpSource(line, true).slice(1);
	return { negated, dirOnly, regex: new RegExp(source) };
}

function ruleMatches(path: string, wasDir: boolean, rule: IgnoreRule): boolean {
	if (rule.regex.test(path)) {
		if (rule.dirOnly && !wasDir) return false;
		return true;
	}
	if (!path.includes("/")) return false;
	let slash = path.indexOf("/");
	while (slash !== -1) {
		if (rule.regex.test(path.slice(0, slash))) return true;
		slash = path.indexOf("/", slash + 1);
	}
	return false;
}

export class IgnoreMatcher {
	private rules: IgnoreRule[] = [];

	add(patterns: string[]): void {
		for (const pattern of patterns) {
			const rule = parseRule(pattern);
			if (rule) this.rules.push(rule);
		}
	}

	ignores(path: string): boolean {
		const wasDir = path.endsWith("/");
		const trimmed = path.replace(/\/+$/, "");
		let slash = trimmed.indexOf("/");
		while (slash !== -1) {
			if (this.lastMatchState(trimmed.slice(0, slash), true)) return true;
			slash = trimmed.indexOf("/", slash + 1);
		}
		return this.lastMatchState(trimmed, wasDir);
	}

	private lastMatchState(path: string, wasDir: boolean): boolean {
		let ignored = false;
		for (const rule of this.rules) {
			if (ruleMatches(path, wasDir, rule)) ignored = !rule.negated;
		}
		return ignored;
	}
}

export function ignore(): IgnoreMatcher {
	return new IgnoreMatcher();
}

export default ignore;
