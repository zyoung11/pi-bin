// typeof over static types and union-typed values: trivial primitive
// operands fold to the JS constant; union operands dispatch on the runtime
// tag — as a TEST (typeof u === "lit" is a tag test, narrowing composes)
// and as a VALUE (`${typeof u}` is a per-arm dispatch). typeof null is
// "object", JS's oldest wart, preserved exactly.

// Folded primitives (literals and typed locals).
console.log(typeof "s", typeof 1, typeof true);
const n = 42;
const s = "x";
const b = false;
console.log(typeof n, typeof s, typeof b);
const f: () => number = () => 1;
console.log(typeof f, f());
const arr = [1, 2];
const rec = { a: 1 };
console.log(typeof arr, typeof rec);

// Union tests: the comparison form, === and !==, both operand orders.
function classify(x: string | number): string {
  if (typeof x === "string") return "str:" + x;
  if ("number" === typeof x) return "num:" + String(x);
  return "unreachable";
}
console.log(classify("hi"), classify(7));

function notString(x: string | number | boolean): string {
  if (typeof x !== "string") return "other";
  return x;
}
console.log(notString("keep"), notString(3), notString(true));

// Unit arms: undefined answers "undefined", null answers "object".
function unitAnswers(x: string | undefined, y: number | null): string {
  return `${typeof x} ${typeof y}`;
}
console.log(unitAnswers("a", 1));
console.log(unitAnswers(undefined, null));

// Several arms sharing one answer: record and array arms are both
// "object"; the test matches the whole tag set.
function isObj(v: string | { a: number } | number[]): boolean {
  return typeof v === "object";
}
console.log(isObj("s"), isObj({ a: 1 }), isObj([1]));

// Statically-decided tests fold: no arm of x answers "boolean".
function neverBool(x: string | number): boolean {
  return typeof x === "boolean";
}
console.log(neverBool("a"), neverBool(1));

// The value form over a many-armed union.
function answer(v: string | number | boolean | undefined | null | { a: number }): string {
  return typeof v;
}
console.log(answer("s"), answer(1), answer(true));
console.log(answer(undefined), answer(null), answer({ a: 2 }));

// Narrowing composes with the tag test inside branches.
function useNarrow(data: string | { a: number }): number {
  if (typeof data === "string") {
    return data.length;
  }
  return data.a;
}
console.log(useNarrow("abcd"), useNarrow({ a: 9 }));

// Union typeof through property reads (pure re-emittable operands).
const box: { v: string | number } = { v: "deep" };
console.log(typeof box.v, typeof box.v === "string");
box.v = 5;
console.log(typeof box.v, typeof box.v !== "string");
