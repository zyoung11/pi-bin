// Flow over `any` bindings: the checker's own control-flow types narrow
// evolving-any reads (the free shadow analysis), typeof tests answer from
// the dyn kind table, and for-of/for-in assign PRE-DECLARED any bindings
// per pass — the classic ES5-era corpus shapes.

// typeof narrowing on an any binding compiles the branch concretely.
let probe: any = "narrow";
if (typeof probe === "string") {
  console.log(probe.toUpperCase());
}
probe = 12;
if (typeof probe === "number") {
  console.log(probe + 1);
}

// for-of over a concrete array into a pre-declared any binding: one shared
// binding, assigned per pass, holding the last element after the loop.
var v;
for (v of [10, 20, 30]) {
  console.log(`${v}`);
}
console.log(`${v}`);

// The parenthesized-target spelling.
var w;
for ((w) of ["a", "b"]) console.log(`${w}`);

// for-of over an empty array: the loop body never runs, the binding keeps
// its undefined.
var e;
for (e of []) {
  console.log("never");
}
console.log(typeof e);

// for-in over a record into a pre-declared any binding: the keys assign.
var k;
for (k in { alpha: 1, beta: 2 }) {
  console.log(`${k}`);
}
console.log(`${k}`);

// Conditional assignment: the potentially-unassigned catch shape.
let foo;
try {
  if (Math.random() >= 0) {
    foo = 1234;
  }
} catch {
  console.log("no");
}
console.log(`${foo}`);

// Ternary joining an any binding with a function expression: the function
// arm boxes into the checked-dynamic tree, the join stays checked-dynamic.
let a: any;
const c = true ? a : function () {};
console.log(typeof c);
const d = false ? a : function () {};
console.log(typeof d);

// ASI: a bare `type` line is an expression statement reading the binding,
// and `Foo = string` assigns one any binding from another.
var type;
var text;
var Foo;
type
Foo = text;
console.log(typeof Foo, typeof type);

// typeof over pure computations folds to the static type's name.
const t1 = 10;
const t2 = 3;
console.log(typeof (t1 ** t2 ** t1));
console.log(`${typeof (t1 + t2)}`);

// Assignment expressions nested in literals, landing in an any target.
var target, p, q;
target = [p = 1, q = p];
console.log(`${p} ${q}`);
var aegis, b1, b2;
aegis = { x: b1 = 1, y: b2 = b1 };
console.log(`${b1} ${b2}`);
