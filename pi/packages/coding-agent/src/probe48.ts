// Probe: generic class with definite-assignment T field read before write.

interface NextResult<T> {
	done: boolean;
	value: T;
}

class Stream<T> {
	private queue: T[] = [];
	private lastEvent!: T;
	private done = false;

	push(event: T): void {
		if (this.done) return;
		this.lastEvent = event;
		this.queue.push(event);
	}

	end(): void {
		this.done = true;
	}

	next(): NextResult<T> {
		if (this.queue.length > 0) {
			const value: T = this.queue[0];
			this.queue.splice(0, 1);
			return { value: value, done: false };
		}
		if (this.done) {
			return { value: this.lastEvent, done: true };
		}
		return { value: this.queue[0], done: false };
	}
}

const stream = new Stream<string>();
stream.push("a");
stream.end();

const empty = new Stream<string>();
empty.end();

export function probeStream(): string {
	const out: string[] = [];
	let step = stream.next();
	while (!step.done) {
		out.push(step.value);
		step = stream.next();
	}
	out.push(`done:${String(step.value)}`);
	const emptyStep = empty.next();
	out.push(`empty-done:${String(emptyStep.done)}`);
	return out.join(",");
}

console.log(probeStream());
