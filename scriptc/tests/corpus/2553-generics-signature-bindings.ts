// Generic function TYPES as annotations: a const holding a plain arrow
// under a generic-signature annotation (`type Mapper = <T>(x: T) => T`)
// monomorphizes exactly like `const g = <T>(x: T) => x` — the type
// parameters live on the annotation's call signature, and the checker
// types the initializer's parameters by them.
type Mapper = <T>(x: T) => T;
const g: Mapper = (x) => x;
console.log(g(2), g("t"), g([1, 2]).length, g(true));

// Multiple type parameters through an alias, with a generic callback.
type Fold = <T, U>(a: T[], f: (t: T) => U) => U[];
const fold: Fold = (a, f) => {
  const out: ReturnType<typeof f>[] = [];
  for (const t of a) out.push(f(t));
  return out;
};
console.log(fold([1, 2, 3], (n) => n * 2).join(","));
console.log(fold(["a", "bb", "ccc"], (s) => s.length).join(","));
console.log(fold([true, false], (b) => (b ? "T" : "F")).join(""));

// An INLINE generic function type (no alias) annotates the same way.
const twice: <T>(v: T) => [T, T] = (v) => [v, v];
const [p, q] = twice("z");
console.log(p + q, twice(4)[1]);

// The annotated binding also works as a pinned VALUE and via aliases.
const gAlias = g;
console.log(gAlias(7) - 1);
function applyNum(f: (n: number) => number, v: number): number {
  return f(v);
}
console.log(applyNum(g, 10));

// A function-expression initializer under the alias annotation.
const ident: Mapper = function (x) {
  return x;
};
console.log(ident("fn"), ident(12) + 1);

// Instantiations at record and union-free container types.
const box: <T>(v: T) => { v: T } = (v) => ({ v });
console.log(box("b").v, box(3).v * 3, box([1, 2, 3]).v.length);
