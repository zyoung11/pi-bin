export function getPiUserAgent(version: string): string {
	const runtime = `node`;
	return `pi/${version} (${process.platform}; ${runtime}; ${process.arch})`;
}
