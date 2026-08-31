import type { AssistantMessage, AssistantMessageEvent } from "../types.ts";

/** Iterator-shaped next() result (the lib IteratorResult union has no scriptc mapping). */
export interface EventStreamNextResult<T> {
	done: boolean;
	value: T;
}

// Generic event stream class for async iteration
export class EventStream<T, R = T> {
	private queue: T[] = [];
	private waiting: ((value: EventStreamNextResult<T>) => void)[] = [];
	private resultWaiters: ((result: R) => void)[] = [];
	private done = false;
	private finalResult: R | undefined;
	private finalResultSet = false;
	private events: T[] = [];
	private cursor = 0;
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
		this.events.push(event);

		const waiter = this.waiting.length > 0 ? this.waiting[0] : undefined;
		if (waiter !== undefined) {
			this.waiting.splice(0, 1);
			const value: T = this.events[this.cursor];
			const isDone = this.done && this.cursor === this.events.length - 1;
			this.cursor += 1;
			waiter({ value: value, done: isDone });
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
		const pending = this.waiting.length > 0 ? this.waiting[0] : undefined;
		if (pending !== undefined) {
			this.waiting.splice(0, 1);
			const value: T = this.events.length > 0 ? this.events[this.events.length - 1] : (undefined as unknown as T);
			this.cursor = this.events.length;
			pending({ value: value, done: true });
		}
		const waiters = this.resultWaiters;
		this.resultWaiters = [];
		for (const resultWaiter of waiters) {
			resultWaiter(this.finalResult as R);
		}
	}

	next(): Promise<EventStreamNextResult<T>> {
		if (this.cursor < this.events.length) {
			const value: T = this.events[this.cursor];
			this.cursor += 1;
			const isDone = this.done && this.cursor === this.events.length;
			return Promise.resolve({ value: value, done: isDone });
		}
		if (this.done && this.events.length > 0) {
			const value: T = this.events[this.events.length - 1];
			return Promise.resolve({ value: value, done: true });
		}
		return new Promise<EventStreamNextResult<T>>((resolve) => {
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
