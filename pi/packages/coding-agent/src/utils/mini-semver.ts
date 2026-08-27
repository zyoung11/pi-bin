/**
 * Minimal semver implementation covering the API surface this codebase uses (valid, validRange,
 * compare, gt, rcompare, satisfies, maxSatisfying) with support for exact versions, ^/~ ranges,
 * comparator lists, x-ranges, hyphen ranges and prerelease ordering.
 */

interface SemVer {
	major: number;
	minor: number;
	patch: number;
	prerelease: string[];
}

interface Comparator {
	op: ">" | ">=" | "<" | "<=" | "=";
	ver: SemVer;
}

const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z][0-9A-Za-z.-]*|-[0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

function parseVersion(version: string): SemVer | null {
	const match = VERSION_PATTERN.exec(version.trim());
	if (!match) return null;
	const prereleaseText = match[4];
	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
		prerelease: prereleaseText ? prereleaseText.replace(/^-/, "").split(".") : [],
	};
}

function comparePrerelease(left: string[], right: string[]): number {
	if (left.length === 0 && right.length === 0) return 0;
	if (left.length === 0) return 1;
	if (right.length === 0) return -1;
	const length = Math.max(left.length, right.length);
	for (let index = 0; index < length; index += 1) {
		const l = left[index];
		const r = right[index];
		if (l === undefined) return -1;
		if (r === undefined) return 1;
		const ln = Number(l);
		const rn = Number(r);
		if (!Number.isNaN(ln) && !Number.isNaN(rn)) {
			if (ln !== rn) return ln < rn ? -1 : 1;
			continue;
		}
		if (Number.isNaN(ln) !== Number.isNaN(rn)) return Number.isNaN(ln) ? 1 : -1;
		if (l !== r) return l < r ? -1 : 1;
	}
	return 0;
}

function compareParsed(a: SemVer, b: SemVer): number {
	if (a.major !== b.major) return a.major < b.major ? -1 : 1;
	if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
	if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
	return comparePrerelease(a.prerelease, b.prerelease);
}

export function valid(version: string): string | null {
	return parseVersion(version) !== null ? version.trim() : null;
}

function parseVersionOrXRange(text: string): { ver: SemVer | null; anyVersion: boolean } {
	const trimmed = text.trim();
	if (trimmed === "*" || trimmed === "" || trimmed === "x" || trimmed === "X") {
		return { ver: null, anyVersion: true };
	}
	return { ver: parseVersion(trimmed), anyVersion: false };
}

function parseComparator(token: string): Comparator | null {
	const match = /^(>=|<=|>|<|=|\^|~)?\s*v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-([0-9A-Za-z.-]+))?$/.exec(
		token.trim(),
	);
	if (!match) return null;
	const opText = match[1] ?? "=";
	const majorText = match[2];
	const minorText = match[3];
	const patchText = match[4];
	if (majorText === "x" || majorText === "X" || majorText === "*") {
		return { op: ">=", ver: { major: 0, minor: 0, patch: 0, prerelease: [] } };
	}
	const major = Number(majorText);
	const minorIsAny = minorText === undefined || minorText === "x" || minorText === "X" || minorText === "*";
	const patchIsAny = patchText === undefined || patchText === "x" || patchText === "X" || patchText === "*";
	const minor = minorIsAny ? 0 : Number(minorText);
	const patch = patchIsAny ? 0 : Number(patchText);
	const base: SemVer = { major, minor, patch, prerelease: match[5] ? match[5].split(".") : [] };
	if (minorIsAny) {
		if (opText === "<") return { op: "<", ver: { major, minor: 0, patch: 0, prerelease: [] } };
		return { op: ">=", ver: base };
	}
	if (patchIsAny) {
		if (opText === "<") return { op: "<", ver: { major, minor, patch: 0, prerelease: [] } };
		return { op: ">=", ver: base };
	}
	if (opText === "^") {
		const upper =
			major > 0
				? { major: major + 1, minor: 0, patch: 0, prerelease: [] }
				: minor > 0
					? { major: 0, minor: minor + 1, patch: 0, prerelease: [] }
					: { major: 0, minor: 0, patch: patch + 1, prerelease: [] };
		return { op: "<", ver: upper };
	}
	if (opText === "~") {
		return { op: "<", ver: { major, minor: minor + 1, patch: 0, prerelease: [] } };
	}
	return { op: opText === "" ? "=" : (opText as ">" | ">=" | "<" | "<=" | "="), ver: base };
}

function comparatorSatisfied(candidate: SemVer, comparator: Comparator, rangeHasPrerelease: boolean): boolean {
	if (comparator.op === "=") {
		return compareParsed(candidate, comparator.ver) === 0;
	}
	if (comparator.op === ">") {
		return compareParsed(candidate, comparator.ver) > 0;
	}
	if (comparator.op === ">=") {
		return compareParsed(candidate, comparator.ver) >= 0;
	}
	if (comparator.op === "<") {
		return compareParsed(candidate, comparator.ver) < 0;
	}
	return compareParsed(candidate, comparator.ver) <= 0;
}

function alternativeSatisfied(candidate: SemVer, alternative: string, rangeHasPrerelease: boolean): boolean {
	const hyphenMatch = /^(\S+)\s+-\s+(\S+)$/.exec(alternative);
	const tokens: string[] = [];
	if (hyphenMatch) {
		tokens.push(`>=${hyphenMatch[1]}`, `<=${hyphenMatch[2]}`);
	} else {
		for (const token of alternative.split(/\s+/)) {
			if (token.trim() !== "") tokens.push(token.trim());
		}
	}
	if (tokens.length === 0) return true;
	for (const token of tokens) {
		const comparator = parseComparator(token);
		if (!comparator) return false;
		if (!comparatorSatisfied(candidate, comparator, rangeHasPrerelease)) return false;
	}
	return true;
}

export function satisfies(version: string, range: string): boolean {
	const candidate = parseVersion(version);
	if (!candidate) return false;
	const normalized = range.trim();
	if (normalized === "" || normalized === "*" || normalized === "x" || normalized === "X") return true;
	for (const alternative of normalized.split("||")) {
		if (alternativeSatisfied(candidate, alternative.trim(), normalized.includes("-"))) return true;
	}
	return false;
}

export function compare(a: string, b: string): number {
	const left = parseVersion(a);
	const right = parseVersion(b);
	if (!left || !right) return 0;
	return compareParsed(left, right);
}

export function gt(a: string, b: string): boolean {
	return compare(a, b) > 0;
}

export function rcompare(a: string, b: string): number {
	return -compare(a, b);
}

export function validRange(range: string): string | null {
	const normalized = range.trim();
	if (normalized === "") return null;
	if (normalized === "*" || normalized === "x" || normalized === "X") return normalized;
	for (const alternative of normalized.split("||")) {
		const hyphenMatch = /^(\S+)\s+-\s+(\S+)$/.exec(alternative.trim());
		const tokens = hyphenMatch
			? [`>=${hyphenMatch[1]}`, `<=${hyphenMatch[2]}`]
			: alternative.trim().split(/\s+/).filter((token) => token !== "");
		if (tokens.length === 0) return null;
		for (const token of tokens) {
			if (parseComparator(token) === null) return null;
		}
	}
	return normalized;
}

export function maxSatisfying(versions: string[], range: string): string | null {
	let best: string | null = null;
	for (const version of versions) {
		if (!satisfies(version, range)) continue;
		if (best === null || compare(version, best) > 0) best = version;
	}
	return best;
}
