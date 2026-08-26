// The EMPTY tuple `[]`: no zero-field tuple shape exists (the IR's tuple
// invariant is n >= 1), so the type rides the ARRAY representation over
// the unit-only element — its only inhabitant is the empty array, and
// length reads the runtime 0. Element-facing surfaces (JSON.stringify,
// spread, iteration) keep their unit-element fences: no element ever
// exists, but the type-directed checks see the unit arm.
const t: [] = [];
console.log(t.length);

// An uninitialized declaration of the type compiles too; reads before
// assignment don't occur.
let u: [];
u = [];
console.log(u.length);

// The empty tuple flows like any array value.
function arity(v: []): number {
  return v.length;
}
console.log(arity(t), arity([]));
