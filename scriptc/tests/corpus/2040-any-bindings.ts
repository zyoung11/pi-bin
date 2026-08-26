// The honest static subset of `any`: unannotated and any-typed BINDINGS
// ride the checked-dynamic tree. Declarations (initialized and not),
// hoisting, assignment round trips, reads, typeof, truthiness, equality,
// templates, and console rendering — all Node-exact without the engine.

// Uninitialized declarations read `undefined` (module scope).
var u;
let v;
console.log(`${u} ${v}`);
console.log(typeof u, typeof v);
console.log(u === undefined, v === undefined);

// Evolving `any`: assignments of concrete values; the checker's flow types
// narrow the reads, so downstream operations compile concretely.
let e;
e = 5;
console.log(e + 1);
e = "text";
console.log(e.length);
e = true;
console.log(!e);

// Assignments of every dyn-representable kind, read back through the slot.
let slot: any;
slot = 42;
console.log(slot, typeof slot);
slot = "str";
console.log(slot, typeof slot);
slot = false;
console.log(slot, typeof slot);
slot = null;
console.log(slot, typeof slot);
slot = { a: 1, b: "two" };
console.log(typeof slot);
slot = [1, 2, 3];
console.log(typeof slot);

// any-to-any copies alias the same value.
let src: any = "shared";
let dst: any;
dst = src;
console.log(dst, dst === src);

// Truthiness over the dyn kinds.
let t: any;
t = 0;
console.log(t ? "truthy" : "falsy");
t = "x";
console.log(t ? "truthy" : "falsy");
t = "";
console.log(t ? "truthy" : "falsy");
t = null;
console.log(t ? "truthy" : "falsy");

// Templates and string conversion.
let tp: any = 3.5;
console.log(`n=${tp}`);
tp = "s";
console.log(`s=${tp}`);
tp = undefined;
console.log(`u=${tp}`);

// `var` hoisting: an unannotated var holds undefined until its assignment
// statement runs, then the value (one shared function-scoped binding).
var assignedVar;
console.log(typeof assignedVar);
assignedVar = "assigned";
console.log(assignedVar);

// Block-nested `var` is module-scoped; block `let` shadows independently.
{
  var nested = 1;
  let x;
  x = 2;
  console.log(x);
}
console.log(nested);

// Function-scope bindings and closures over any locals.
function scoped(): void {
  let inner;
  inner = 9;
  const get = (): any => inner;
  console.log(get());
}
scoped();

// Module-level any captured and written by a function.
let shared;
function bump(): void {
  shared = 7;
}
bump();
console.log(`${shared}`);

// Exit into typed slots validates (the values are what they claim).
const back: any = 12;
const num: number = back;
console.log(num * 2);
const sarr: any = ["a", "b"];
const arr: string[] = sarr;
console.log(arr.join("+"));
