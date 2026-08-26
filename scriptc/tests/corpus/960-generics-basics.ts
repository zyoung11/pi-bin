// Generic top-level functions, monomorphized: one native function per
// distinct instantiation, several instantiations coexisting, explicit type
// arguments, generics over every value kind (numbers, strings, booleans,
// arrays, records).
function id<T>(x: T): T {
  return x;
}

function firstOf<T>(a: T[]): T {
  return a[0];
}

function pairText<T, U>(a: T, b: U): string {
  return `${id(a)}~${id(b)}`; // generic calling generic, two params
}

function swap<T, U>(p: { a: T; b: U }): { a: U; b: T } {
  return { a: p.b, b: p.a };
}

// Several instantiations of one function coexist.
console.log(id(41) + 1, id("str"), id(true), id(false));

// Explicit type arguments.
console.log(id<number>(7), id<string>("seven"), pairText<number, boolean>(0, true));

// Literal widening: `id(1)` and `id(2)` share one instance with `id(x)`.
const one = 1;
console.log(id(one) + id(2) + id(3));

// Generics over arrays (including nested) and records.
console.log(firstOf([10, 20]), firstOf(["a", "b"]), firstOf([[5]])[0]);
const pt = id({ x: 3, y: 4 });
console.log(pt.x * pt.x + pt.y * pt.y);

// A generic returning a different record shape than it takes.
const swapped = swap({ a: 1, b: "one" });
console.log(swapped.a, swapped.b);
console.log(pairText("L", 9), pairText(false, "R"));

// Interface/type-alias names instantiate structurally through generics too.
interface Box<T> {
  v: T;
}
function unbox<T>(b: { v: T }): T {
  return b.v;
}
const bn: Box<number> = { v: 99 };
const bs: Box<string> = { v: "boxed" };
console.log(unbox(bn), unbox(bs));
