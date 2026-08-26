// @dynamic
// An 'any' value PROVABLY null/undefined flowing into a primitive slot is
// a compile-time fence, not a runtime TypeError: the validated exit
// refuses units unconditionally, so the program could only ever throw
// where Node proceeds silently. Three provable spellings: a const bound
// to null, a `var` nothing ever assigns, and a hoisted `var` whose only
// initializer is a unit (undefined before the statement, null after —
// the message names both). Explicit casts keep their runtime checked-cast
// semantics and stay compilable (the island harness pins that).
const a: any = null;
const b: string = a;

function foo(test: string): number {
  return test.length;
}
var x: any;
foo(x);

var mixed: any = null;
const n: number = mixed;

export const marker: number = b.length + n;
