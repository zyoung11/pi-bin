/**
 * Minimal glob matcher covering the minimatch surface this codebase uses: `*`, `**`, `?`,
 * character classes, single-level brace expansion and the `nocase` option.
 */

export interface MinimatchOptions {
	nocase?: boolean;
}

const segmentCache: Record<string, RegExp> = {};

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
				out += segment.slice(index, end + 1);
				index = end + 1;
				continue;
			}
		}
		out += escapeRegExp(char);
		index += 1;
	}
	return `^${out}$`;
}

function segmentMatcher(segment: string, nocase: boolean): RegExp {
	const cacheKey = `${nocase ? "i:" : "s:"}${segment}`;
	const cached = segmentCache[cacheKey];
	if (cached) return cached;
	const flags = nocase ? "i" : "";
	const regex = new RegExp(segmentToRegExpSource(segment), flags);
	segmentCache[cacheKey] = regex;
	return regex;
}

function expandBraces(pattern: string): string[] {
	const start = pattern.indexOf("{");
	if (start === -1) return [pattern];
	const end = pattern.indexOf("}", start + 1);
	if (end === -1) return [pattern];
	const prefix = pattern.slice(0, start);
	const suffix = pattern.slice(end + 1);
	const alternatives = pattern.slice(start + 1, end).split(",");
	const out: string[] = [];
	for (const alternative of alternatives) {
		for (const expanded of expandBraces(`${prefix}${alternative}${suffix}`)) {
			out.push(expanded);
		}
	}
	return out;
}

function matchSegments(pattern: string[], target: string[], nocase: boolean): boolean {
	if (pattern.length === 0) return target.length === 0;
	const head = pattern[0];
	if (head === "**") {
		for (let skip = 0; skip <= target.length; skip += 1) {
			if (matchSegments(pattern.slice(1), target.slice(skip), nocase)) return true;
		}
		return false;
	}
	if (target.length === 0) return false;
	if (!segmentMatcher(head, nocase).test(target[0])) return false;
	return matchSegments(pattern.slice(1), target.slice(1), nocase);
}

export function minimatch(target: string, pattern: string, options?: MinimatchOptions): boolean {
	const nocase = options?.nocase === true;
	for (const expanded of expandBraces(pattern)) {
		const patternSegments = expanded.split("/");
		const targetSegments = target.split("/");
		if (matchSegments(patternSegments, targetSegments, nocase)) return true;
	}
	return false;
}
