/**
 * Generic undo stack with clone-on-push semantics.
 *
 * Stores deep clones of state snapshots. Popped snapshots are returned
 * directly (no re-cloning) since they are already detached.
 */
export class UndoStack<S> {
	private stack: S[] = [];
	private cloneState: (state: S) => S;

	constructor(cloneState: (state: S) => S) {
		this.cloneState = cloneState;
	}

	/** Push a deep clone of the given state onto the stack. */
	push(state: S): void {
		this.stack.push(this.cloneState(state));
	}

	/** Pop and return the most recent snapshot, or undefined if empty. */
	pop(): S | undefined {
		return this.stack.pop();
	}

	/** Remove all snapshots. */
	clear(): void {
		this.stack = [];
	}

	get length(): number {
		return this.stack.length;
	}
}
