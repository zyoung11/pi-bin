/**
 * Minimal hosted-git-info replacement covering fromUrl for the standard git hosts, exposing the
 * domain/user/project/committish fields this codebase reads.
 */

export interface HostedInfo {
	type: string;
	domain: string;
	user: string;
	project: string;
	committish: string | null;
}

interface HostRule {
	type: string;
	domain: string;
}

const HOSTS: HostRule[] = [
	{ type: "github", domain: "github.com" },
	{ type: "gist", domain: "gist.github.com" },
	{ type: "gitlab", domain: "gitlab.com" },
	{ type: "bitbucket", domain: "bitbucket.org" },
	{ type: "sourcehut", domain: "git.sr.ht" },
];

function fromWebUrlParts(domain: string, path: string, type: string, gitDomain: string): HostedInfo | null {
	const pathNoLeading = path.replace(/^\/+/, "");
	const hashSplit = pathNoLeading.indexOf("#");
	const cleanPath = hashSplit === -1 ? pathNoLeading : pathNoLeading.slice(0, hashSplit);
	const committish = hashSplit === -1 ? null : pathNoLeading.slice(hashSplit + 1);
	const pathNoTrailing = cleanPath.replace(/\/+$/, "");
	const segments = pathNoTrailing.split("/");
	if (segments.length < 2) return null;
	const user = segments[0];
	const project = segments[1].replace(/\.git$/, "");
	if (user === "" || project === "") return null;
	return { type, domain: gitDomain, user, project, committish };
}

export function fromUrl(url: string): HostedInfo | null {
	const trimmed = url.trim();
	const hashSplit = trimmed.indexOf("#");
	const withoutRef = hashSplit === -1 ? trimmed : trimmed.slice(0, hashSplit);
	const committish = hashSplit === -1 ? null : trimmed.slice(hashSplit + 1);

	const shorthandMatch = /^(github|gitlab|bitbucket|gist):\/?\/?([^/]+)\/([^/#]+)/.exec(withoutRef);
	if (shorthandMatch) {
		const rule = HOSTS.find((host) => host.type === shorthandMatch[1]);
		if (!rule) return null;
		return {
			type: rule.type,
			domain: rule.domain,
			user: shorthandMatch[2],
			project: shorthandMatch[3].replace(/\.git$/, ""),
			committish,
		};
	}

	const scpMatch = /^git@([^:/]+):([^/]+)\/([^/]+?)(?:\.git)?$/.exec(withoutRef);
	if (scpMatch) {
		const rule = HOSTS.find((host) => host.domain === scpMatch[1]);
		if (!rule) return null;
		return {
			type: rule.type,
			domain: rule.domain,
			user: scpMatch[2],
			project: scpMatch[3].replace(/\.git$/, ""),
			committish,
		};
	}

	const urlMatch = /^(https?|ssh|git):\/\/(?:[^/@]+@)?([^/:]+)[/:]\/?(.+)$/.exec(withoutRef);
	if (!urlMatch) return null;
	const rule = HOSTS.find((host) => host.domain === urlMatch[2]);
	if (!rule) return null;
	const webUrl = urlMatch[1] === "ssh" || urlMatch[1] === "git" ? `https://${urlMatch[2]}/${urlMatch[3]}` : withoutRef;
	const schemeIdx = webUrl.indexOf("://");
	if (schemeIdx === -1) return null;
	const afterScheme = webUrl.slice(schemeIdx + 3);
	const slashIdx = afterScheme.indexOf("/");
	if (slashIdx === -1) return null;
	const domain = afterScheme.slice(0, slashIdx);
	const path = afterScheme.slice(slashIdx + 1);
	const info = fromWebUrlParts(domain, path, rule.type, rule.domain);
	if (info && committish !== null && info.committish === null) info.committish = committish;
	return info;
}

export default { fromUrl };
