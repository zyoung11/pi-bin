// Probe: writable-record primitives for defusing cast-view write sites.

interface Src {
	a: string;
	b: number;
}

function recordOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

export function probeViewSelfConsistent(): string {
	const src: Src = { a: "x", b: 1 };
	const view = recordOf(src);
	view["c"] = true;
	delete view["b"];
	const keys = Object.keys(view).sort().join(",");
	return `view-self keys=${keys}|c=${String(view["c"])}|b=${String(view["b"])}`;
}

interface Indexable {
	[index: string]: unknown;
	a: string;
	b: number;
}

export function probeDirectAssignFromTyped(): string {
	const src: Indexable = { a: "x", b: 1 };
	const view: Record<string, unknown> = src;
	view["c"] = true;
	delete view["b"];
	const keys = Object.keys(src).sort().join(",");
	const viewKeys = Object.keys(view).sort().join(",");
	return `direct-assign src=${keys}|view=${viewKeys}`;
}

export function probeSpreadToRecord(): string {
	const src: Indexable = { a: "x", b: 1 };
	const srcView: Record<string, unknown> = src;
	const merged: Record<string, unknown> = { ...srcView };
	merged["c"] = true;
	delete merged["b"];
	const viewKeys = Object.keys(merged).sort().join(",");
	return `spread view=${viewKeys}|c=${String(merged["c"])}`;
}

export function probeFieldLoopRebuild(): string {
	const src: Indexable = { a: "x", b: 1 };
	const srcView: Record<string, unknown> = src;
	const merged: Record<string, unknown> = {};
	for (const key of Object.keys(srcView)) merged[key] = srcView[key];
	merged["c"] = true;
	delete merged["b"];
	const viewKeys = Object.keys(merged).sort().join(",");
	return `rebuild view=${viewKeys}|c=${String(merged["c"])}`;
}

console.log(probeViewSelfConsistent());
console.log(probeDirectAssignFromTyped());
console.log(probeSpreadToRecord());
console.log(probeFieldLoopRebuild());
