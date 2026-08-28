import { fromUrl } from "./mini-hosted-git-info.ts";

/**
 * Parsed git URL information.
 */
export type GitSource = {
	/** Always "git" for git sources */
	type: "git";
	/** Clone URL (always valid for git clone, without ref suffix) */
	repo: string;
	/** Git host domain (e.g., "github.com") */
	host: string;
	/** Repository path (e.g., "user/repo") */
	path: string;
	/** Git ref (branch, tag, commit) if specified */
	ref?: string;
	/** True if ref was specified (package won't be auto-updated) */
	pinned: boolean;
};

function splitRef(url: string): { repo: string; ref?: string } {
	const scpLikeMatch = url.match(/^git@([^:]+):(.+)$/);
	if (scpLikeMatch) {
		const pathWithMaybeRef = scpLikeMatch[2] ?? "";
		const refSeparator = pathWithMaybeRef.indexOf("@");
		if (refSeparator < 0) return { repo: url };
		const repoPath = pathWithMaybeRef.slice(0, refSeparator);
		const ref = pathWithMaybeRef.slice(refSeparator + 1);
		if (!repoPath || !ref) return { repo: url };
		return {
			repo: `git@${scpLikeMatch[1] ?? ""}:${repoPath}`,
			ref,
		};
	}

	if (url.includes("://")) {
		try {
			const schemeEnd = url.indexOf("://") + 3;
			const pathStart = url.indexOf("/", schemeEnd);
			const pathWithMaybeRef = pathStart < 0 ? "" : url.slice(pathStart).replace(/^\/+/, "");
			const refSeparator = pathWithMaybeRef.indexOf("@");
			if (refSeparator < 0) return { repo: url };
			const repoPath = pathWithMaybeRef.slice(0, refSeparator);
			const ref = pathWithMaybeRef.slice(refSeparator + 1);
			if (!repoPath || !ref) return { repo: url };
			const originEnd = pathStart < 0 ? url.length : url.indexOf("/", schemeEnd);
			const origin = url.slice(0, originEnd);
			return {
				repo: `${origin}/${repoPath}`.replace(/\/$/, ""),
				ref,
			};
		} catch {
			return { repo: url };
		}
	}

	const slashIndex = url.indexOf("/");
	if (slashIndex < 0) {
		return { repo: url };
	}
	const host = url.slice(0, slashIndex);
	const pathWithMaybeRef = url.slice(slashIndex + 1);
	const refSeparator = pathWithMaybeRef.indexOf("@");
	if (refSeparator < 0) {
		return { repo: url };
	}
	const repoPath = pathWithMaybeRef.slice(0, refSeparator);
	const ref = pathWithMaybeRef.slice(refSeparator + 1);
	if (!repoPath || !ref) {
		return { repo: url };
	}
	return {
		repo: `${host}/${repoPath}`,
		ref,
	};
}

function decodeForValidation(value: string): string | null {
	try {
		return decodeURIComponent(value);
	} catch {
		return null;
	}
}

function hasUnsafeGitInstallPart(value: string, allowSlash: boolean): boolean {
	const decoded = decodeForValidation(value);
	if (decoded === null) {
		return true;
	}
	const candidates = [value, decoded];
	for (const candidate of candidates) {
		if (candidate.includes("\0") || candidate.includes("\\") || candidate.startsWith("/")) {
			return true;
		}
		if (!allowSlash && candidate.includes("/")) {
			return true;
		}
		if (candidate.split("/").includes("..")) {
			return true;
		}
	}
	return false;
}

function buildGitSource(args: { repo: string; host: string; path: string; ref?: string }): GitSource | null {
	if (args.path.startsWith("/")) {
		return null;
	}
	const normalizedPath = args.path.replace(/\.git$/, "").replace(/^\/+/, "");
	if (!args.host || !normalizedPath || normalizedPath.split("/").length < 2) {
		return null;
	}
	if (hasUnsafeGitInstallPart(args.host, false) || hasUnsafeGitInstallPart(normalizedPath, true)) {
		return null;
	}

	return {
		type: "git",
		repo: args.repo,
		host: args.host,
		path: normalizedPath,
		ref: args.ref,
		pinned: Boolean(args.ref),
	};
}

function parseGenericGitUrl(url: string): GitSource | null {
	const { repo: repoWithoutRef, ref } = splitRef(url);
	let repo = repoWithoutRef;
	let host = "";
	let path = "";

	const scpLikeMatch = repoWithoutRef.match(/^git@([^:]+):(.+)$/);
	if (scpLikeMatch) {
		host = scpLikeMatch[1] ?? "";
		path = scpLikeMatch[2] ?? "";
	} else if (
		repoWithoutRef.startsWith("https://") ||
		repoWithoutRef.startsWith("http://") ||
		repoWithoutRef.startsWith("ssh://") ||
		repoWithoutRef.startsWith("git://")
	) {
		try {
			const schemeEnd = repoWithoutRef.indexOf("://") + 3;
			const slashIndex2 = repoWithoutRef.indexOf("/", schemeEnd);
			if (slashIndex2 < 0) return null;
			host = repoWithoutRef.slice(schemeEnd, slashIndex2);
			const hostPortEnd = host.indexOf(":");
			if (hostPortEnd >= 0) host = host.slice(0, hostPortEnd);
			path = repoWithoutRef.slice(slashIndex2).replace(/^\/+/, "");
		} catch {
			return null;
		}
	} else {
		const slashIndex = repoWithoutRef.indexOf("/");
		if (slashIndex < 0) {
			return null;
		}
		host = repoWithoutRef.slice(0, slashIndex);
		path = repoWithoutRef.slice(slashIndex + 1);
		if (!host.includes(".") && host !== "localhost") {
			return null;
		}
		repo = `https://${repoWithoutRef}`;
	}

	return buildGitSource({ repo, host, path, ref });
}

/**
 * Parse git source into a GitSource.
 *
 * Rules:
 * - With git: prefix, accept all historical shorthand forms.
 * - Without git: prefix, only accept explicit protocol URLs.
 */
export function parseGitUrl(source: string): GitSource | null {
	const trimmed = source.trim();
	const hasGitPrefix = trimmed.startsWith("git:");
	const url = hasGitPrefix ? trimmed.slice(4).trim() : trimmed;

	if (!hasGitPrefix && !/^(https?|ssh|git):\/\//i.test(url)) {
		return null;
	}

	const split = splitRef(url);

	const hostedCandidates: string[] = [];
	for (const candidate of [split.ref ? `${split.repo}#${split.ref}` : undefined, url]) {
		if (candidate !== undefined) hostedCandidates.push(candidate);
	}
	for (const candidate of hostedCandidates) {
		const info = fromUrl(candidate);
		if (info) {
			if (split.ref && info.project?.includes("@")) {
				continue;
			}
			const useHttpsPrefix =
				!split.repo.startsWith("http://") &&
				!split.repo.startsWith("https://") &&
				!split.repo.startsWith("ssh://") &&
				!split.repo.startsWith("git://") &&
				!split.repo.startsWith("git@");
			return buildGitSource({
				repo: useHttpsPrefix ? `https://${split.repo}` : split.repo,
				host: info.domain || "",
				path: `${info.user}/${info.project}`,
				ref: info.committish || split.ref || undefined,
			});
		}
	}

	const httpsCandidates: string[] = [];
	for (const candidate of [split.ref ? `https://${split.repo}#${split.ref}` : undefined, `https://${url}`]) {
		if (candidate !== undefined) httpsCandidates.push(candidate);
	}
	for (const candidate of httpsCandidates) {
		const info = fromUrl(candidate);
		if (info) {
			if (split.ref && info.project?.includes("@")) {
				continue;
			}
			return buildGitSource({
				repo: `https://${split.repo}`,
				host: info.domain || "",
				path: `${info.user}/${info.project}`,
				ref: info.committish || split.ref || undefined,
			});
		}
	}

	return parseGenericGitUrl(url);
}
