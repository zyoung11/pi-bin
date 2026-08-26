// Computed keys in destructuring over STATIC record sources fold at
// compile time: `{ [k]: v }` where k is a pure expression whose checker
// type spells ONE property name (consts, enum members, templates of
// literals) reads the same field tsc late-bound — declarations and
// assignments alike; string-literal and numeric-literal keys spell
// themselves. Folded keys count as consumed for rest packing.
const k = "x";
const o = { x: 1, y: 2 };
const { [k]: v } = o;
console.log(v);
let w = 0;
({ [k]: w } = o);
console.log(w);
const enum E { a = "y" }
const { [E.a]: ev } = o;
console.log(ev);
const { [`${"x"}`]: tv } = o;
console.log(tv);
const { "y": sv } = o;
console.log(sv);
// Folded key consumed by rest: the pack excludes it.
const { [k]: taken, ...rest } = o;
console.log(taken, JSON.stringify(rest));
// Assignment twin with a default on the folded key.
const oo: { x?: number; y: number } = { y: 9 };
let d = 0;
({ [k]: d = 41 } = oo);
console.log(d);
