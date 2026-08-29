export function getPiUserAgent(): string {
	return `pi (${process.platform} ${process.arch})`;
}
