// @exit: 1
// An UNCAUGHT ambient-root trap at module top level: Node prints what ran,
// then dies with the ReferenceError — module init unwinds at the trap
// declaration, and every later statement (including statements that would
// fence if they lowered under a value-world lie) is dead. The binding that
// never initialized is a TRAP binding: references to it can never execute.

console.log("before");

interface Type<t> {
  pipe<fn extends (In: t) => unknown>(fn: fn): Type<fn>;
}
declare const t: Type<string>;

export const out = t.pipe((s: string) => s.length); // ReferenceError: t is not defined

// Dead code past the unwind: a read of the trap binding, and another
// ambient-rooted chain — neither runs.
export const dead = out;
console.log("never", dead);
