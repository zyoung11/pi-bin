class AbortControllerList2 {
	private items: AbortController[] = [];

	add(c: AbortController): void {
		this.items.push(c as AbortController);
	}

	abortAll(): void {
		for (const item of this.items) (item as AbortController).abort();
		this.items.length = 0;
	}

	count(): number {
		return this.items.length;
	}
}

class ReadonlyHolder {
	private readonly items: unknown[] = [];

	add(c: AbortController): void {
		this.items.push(c as AbortController);
	}

	count(): number {
		return this.items.length;
	}
}

class Holder {
	private list: AbortControllerList2 = new AbortControllerList2();

	use(c: AbortController): void {
		this.list.add(c);
	}

	probe(): string {
		return `count=${String(this.list.count())}`;
	}
}

export function probeHolder(): string {
	const h = new Holder();
	h.use(new AbortController());
	return h.probe();
}
