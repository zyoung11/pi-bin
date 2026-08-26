// keyof-constrained generic functions monomorphize PER LITERAL KEY: the
// call site's inferred (or explicit) literal binds K, the instance body's
// `o[k]` compiles to a static field read of that key, and `T[K]` resolves
// to the named property's type. Two literals over one object shape are two
// instances even when their IR signatures agree.
function pick<T, K extends keyof T>(o: T, k: K): T[K] {
  return o[k];
}

const obj = { a: 1, b: "two", c: true };
console.log(pick(obj, "a") + 1, pick(obj, "b").length, pick(obj, "c") ? "y" : "n");

// Explicit type arguments bind the same literals as inference.
console.log(pick<{ a: number; b: string; c: boolean }, "b">(obj, "b"));

// Same-typed keys of one shape: distinct instances, distinct fields read.
const pair = { first: "L", second: "R" };
console.log(pick(pair, "first") + pick(pair, "second"));

// A second object shape through the same generic.
const nested = { inner: { d: 4 }, tag: "t" };
console.log(pick(nested, "inner").d, pick(nested, "tag"));

// K FORWARDED through another keyof-constrained generic: the literal
// carries down the chain into the inner instance.
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  const out: T[K][] = [];
  for (const it of items) out.push(pick(it, key));
  return out;
}
const rows = [
  { n: 1, s: "x" },
  { n: 2, s: "y" },
];
console.log(pluck(rows, "n").join("|"), pluck(rows, "s").join("|"));

// A RUNTIME key (no literal binds K) still compiles when the fields share
// one type: the instance reads through the runtime-keyed path.
function grab<T, K extends keyof T>(o: T, k: K): T[K] {
  return o[k];
}
const pt = { x: 10, y: 20 };
const keys: ("x" | "y")[] = ["x", "y"];
for (const k of keys) console.log(grab(pt, k));

// A literal-TYPED key variable outside any generic: the type proves the
// key, so the read is the same static field access.
const kb: "b" = "b";
console.log(obj[kb]);

// keyof instantiations answering records and passing through arithmetic.
function sumOf<T, K extends keyof T>(items: T[], key: K, pick2: (t: T, k: K) => number): number {
  let acc = 0;
  for (const it of items) acc += pick2(it, key);
  return acc;
}
console.log(sumOf(rows, "n", (t, k) => t[k] * 10));
