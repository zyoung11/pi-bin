// Probe: Object.keys + bracket reads over a record with boolean values.

async function main(): Promise<void> {
	let parsed: unknown = JSON.parse('{"\u002fhome\u002fzy": true}');
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		console.log("not object");
		return;
	}
	const rec = parsed as Record<string, unknown>;
	const data: Record<string, number> = {};
	const keys = Object.keys(rec);
	for (const key of keys) {
		const value = rec[key];
		console.error(`DBG key=${key} value=${String(value)} type=${typeof value}`);
		if (typeof value === "boolean") {
			data[key] = value ? 1 : 0;
		}
	}
	console.log(`keys=${Object.keys(data).join(",")}`);
}

void main();
