/**
 * Stdout takeover guard. The statically compiled build cannot monkey-patch process.stdout
 * (no property assignment lowering), so takeover is tracked as a flag: while taken over, the
 * TUI owns stdout and package commands route their output to stderr.
 */

export function takeOverStdout(): void {
	stdoutTakenOver = true;
}

export function restoreStdout(): void {
	stdoutTakenOver = false;
}

export function isStdoutTakenOver(): boolean {
	return stdoutTakenOver;
}

let stdoutTakenOver: boolean = false;

export function writeRawStdout(text: string): void {
	if (text.length === 0) {
		return;
	}
	process.stdout.write(text);
}

export async function flushRawStdout(): Promise<void> {}
