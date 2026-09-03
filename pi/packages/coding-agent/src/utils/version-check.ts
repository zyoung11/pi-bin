import { fetchWithRetry } from "./management-http.ts";
import { compare, valid } from "./mini-semver.ts";
import { getPiUserAgent } from "./pi-user-agent.ts";

const LATEST_VERSION_URL = "https://pi.dev/api/latest-version";
const DEFAULT_VERSION_CHECK_TIMEOUT_MS = 10000;

export interface LatestPiRelease {
	version: string;
	packageName?: string;
	note?: string;
}

/** Include useful details from the error message itself (Error.cause has no scriptc lowering). */
export function formatVersionCheckError(error: unknown): string {
	return error instanceof Error && error.message ? error.message : String(error);
}

export function comparePackageVersions(leftVersion: string, rightVersion: string): number | undefined {
	const left = valid(leftVersion.trim());
	const right = valid(rightVersion.trim());
	if (!left || !right) {
		return undefined;
	}
	return compare(left, right);
}

export function isNewerPackageVersion(candidateVersion: string, currentVersion: string): boolean {
	const comparison = comparePackageVersions(candidateVersion, currentVersion);
	if (comparison !== undefined) {
		return comparison > 0;
	}
	return candidateVersion.trim() !== currentVersion.trim();
}

export async function getLatestPiRelease(
	currentVersion: string,
	options: { timeoutMs?: number; retry?: boolean } = {},
): Promise<LatestPiRelease | undefined> {
	if (process.env.PI_OFFLINE) return undefined;

	const response = await fetchWithRetry(
		LATEST_VERSION_URL,
		{
			headers: {
				"User-Agent": getPiUserAgent(currentVersion),
				accept: "application/json",
			},
		},
		{
			maxRetries: options.retry ? 2 : 0,
			timeoutMs: options.timeoutMs ?? DEFAULT_VERSION_CHECK_TIMEOUT_MS,
		},
	);
	if (!response.ok) return undefined;

	const dataValue: unknown = await response.json();
	if (typeof dataValue !== "object" || dataValue === null) return undefined;
	const data = dataValue as unknown as Record<string, unknown>;
	const versionValue = data["version"];
	if (typeof versionValue !== "string" || !versionValue.trim()) {
		return undefined;
	}
	const packageNameValue = data["packageName"];
	const packageName =
		typeof packageNameValue === "string" && packageNameValue.trim() ? packageNameValue.trim() : undefined;
	const noteValue = data["note"];
	const note = typeof noteValue === "string" && noteValue.trim() ? noteValue.trim() : undefined;
	const release: LatestPiRelease = {
		version: versionValue.trim(),
		packageName,
	};
	if (note !== undefined) release.note = note;
	return release;
}

export async function getLatestPiVersion(
	currentVersion: string,
	options: { timeoutMs?: number; retry?: boolean } = {},
): Promise<string | undefined> {
	return (await getLatestPiRelease(currentVersion, options))?.version;
}

export async function checkForNewPiVersion(currentVersion: string): Promise<LatestPiRelease | undefined> {
	if (process.env.PI_SKIP_VERSION_CHECK) return undefined;

	try {
		const latestRelease = await getLatestPiRelease(currentVersion);
		if (latestRelease && isNewerPackageVersion(latestRelease.version, currentVersion)) {
			return latestRelease;
		}
		return undefined;
	} catch {
		return undefined;
	}
}
