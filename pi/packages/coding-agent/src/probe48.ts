// Probe: missing-key read behaviors on typed vs dyn records.

function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

async function main(): Promise<void> {
	const trustData: Record<string, number> = JSON.parse('{"\u002fhome\u002fzy": 1}');
	console.error(`DBG trust parse ok`);
	let v: unknown;
	try {
		v = recordViewOf(trustData)["\u002fmissing\u002fkey"];
		console.error(`DBG view missing read ok: ${String(v)}`);
	} catch (error) {
		console.error(`DBG view missing read THREW: ${error instanceof Error ? error.message : String(error)}`);
	}
	const direct: number = trustData["\u002fmissing\u002fkey"];
	console.error(`DBG direct missing read ok: ${String(direct)}`);
}

void main();
