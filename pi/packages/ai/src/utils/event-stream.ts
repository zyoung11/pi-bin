import type { AssistantMessage, AssistantMessageEvent } from "../types.ts";

// Generic event stream class for async iteration
export class EventStream<T, R = T> {
	private queue: T[] = [];
	private waiting: ((value: IteratorResult<T>) => void)[] = [];
	private resultWaiters: ((result: R) => void)[] = [];
	private done = false;
	private finalResult: R | undefined;
	private finalResultSet = false;
	private isComplete: (event: T) => boolean;
	private extractResult: (event: T) => R;

	constructor(isComplete: (event: T) => boolean, extractResult: (event: T) => R) {
		this.isComplete = isComplete;
		this.extractResult = extractResult;
	}

	push(event: T): void {
		if (this.done) return;

		if (this.isComplete(event)) {
			this.done = true;
			this.finalResult = this.extractResult(event);
			this.finalResultSet = true;
		}

		const waiter = this.waiting[0];
		if (waiter !== undefined) {
			this.waiting.splice(0, 1);
			waiter({ value: event, done: false });
		} else if (!this.finalResultSet) {
			this.queue.push(event);
		}

		if (this.finalResultSet) {
			const waiters = this.resultWaiters;
			this.resultWaiters = [];
			for (const resultWaiter of waiters) {
				resultWaiter(this.finalResult as R);
			}
		}
	}

	end(result?: R): void {
		this.done = true;
		if (result !== undefined && !this.finalResultSet) {
			this.finalResult = result;
			this.finalResultSet = true;
		}
		const pending = this.waiting[0];
		if (pending !== undefined) {
			this.waiting.splice(0, 1);
			pending({ value: undefined as unknown as T, done: true });
		}
		const waiters = this.resultWaiters;
		this.resultWaiters = [];
		for (const resultWaiter of waiters) {
			resultWaiter(this.finalResult as R);
		}
	}

	next(): Promise<IteratorResult<T>> {
		if (this.queue.length > 0) {
			const value: T = this.queue[0];
			this.queue.splice(0, 1);
			return Promise.resolve({ value, done: false });
		}
		if (this.done) {
			return Promise.resolve({ value: undefined as unknown as T, done: true });
		}
		return new Promise<IteratorResult<T>>((resolve) => {
			this.waiting.push(resolve);
		});
	}

	result(): Promise<R> {
		if (this.finalResultSet) {
			return Promise.resolve(this.finalResult as R);
		}
		if (this.done) {
			return Promise.resolve(undefined as unknown as R);
		}
		return new Promise<R>((resolve) => {
			this.resultWaiters.push(resolve);
		});
	}
}

export class AssistantMessageEventStream extends EventStream<AssistantMessageEvent, AssistantMessage> {
	constructor() {
		super(
			(event) => event.type === "done" || event.type === "error",
			(event) => {
				if (event.type === "done") {
					return event.message;
				} else if (event.type === "error") {
					return event.error;
				}
				throw new Error("Unexpected event type for final result");
			},
		);
	}
}

/** Factory function for AssistantMessageEventStream (for use in extensions) */
export function createAssistantMessageEventStream(): AssistantMessageEventStream {
	return new AssistantMessageEventStream();
}
