// Probe: what does process.argv look like in a compiled binary?

export function probeArgv(): string {
	const argv = process.argv;
	const parts: string[] = [];
	for (const a of argv) parts.push(a);
	return `argc=${String(argv.length)} argv=${parts.join("|")}`;
}

console.log(probeArgv());
