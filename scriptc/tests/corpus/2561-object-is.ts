// Object.is — SameValue across the static kinds: the two number
// divergences from === (NaN equals NaN, +0 differs from -0), strings by
// bytes, booleans and units, reference kinds by pointer identity, union
// operands per arm (the number arm's payload compare upgrades to
// SameValue), and statically disjoint kinds answering false with the
// operands still evaluated.
console.log(Object.is(NaN, NaN), Object.is(0 / 0, NaN), Object.is(NaN, 1));
console.log(Object.is(0, -0), Object.is(-0, -0), Object.is(0, 0), Object.is(-0, 0));
console.log(Object.is(1, 1), Object.is(1, 2), Object.is(1.5, 3 / 2), Object.is(1 / 0, 1 / 0), Object.is(1 / 0, -1 / 0));
console.log(Object.is("a", "a"), Object.is("a", "b"), Object.is("", ""), Object.is("ab", "a" + "b"));
console.log(Object.is(true, true), Object.is(true, false), Object.is(false, false));
console.log(Object.is(null, null), Object.is(undefined, undefined), Object.is(null, undefined), Object.is(undefined, null));

// Mixed kinds: always false, and JS still evaluates both arguments.
let hits = 0;
function n(): number { hits++; return 0; }
function s(): string { hits++; return "0"; }
console.log(Object.is(n(), s()), hits);
console.log(Object.is(1, "1"), Object.is(false, 0), Object.is("", 0), Object.is(null, 0), Object.is(undefined, ""));

// Reference identity: arrays, records, functions, Maps/Sets, class
// instances (including through a base-typed slot), and class values.
const arr = [1, 2];
const arr2 = [1, 2];
console.log(Object.is(arr, arr), Object.is(arr, arr2));
const o = { x: 1 };
console.log(Object.is(o, o), Object.is(o, { x: 1 }));
const f = (): number => 1;
const g = (): number => 2;
console.log(Object.is(f, f), Object.is(f, g));
const m = new Map<string, number>();
console.log(Object.is(m, m), Object.is(m, new Map<string, number>()));
const st = new Set<number>([1]);
console.log(Object.is(st, st), Object.is(st, new Set<number>([1])));
class Base { tag = "b"; }
class Derived extends Base { extra = 1; }
const d = new Derived();
const asBase: Base = d;
const otherBase = new Base();
console.log(Object.is(d, d), Object.is(asBase, d), Object.is(asBase, otherBase));
console.log(Object.is(Base, Base), Object.is(Base, Derived));

// Unions: SameValue per arm — NaN and ±0 payloads answer the spec, ref
// arms compare identity, and a plain side wraps like ===.
function u(v: number | string | null): number | string | null { return v; }
const a1 = u(NaN);
const b1 = u(NaN);
console.log(Object.is(a1, b1), a1 === b1);
const z1 = u(0);
const z2 = u(-0);
console.log(Object.is(z1, z2), z1 === z2, Object.is(z2, u(-0)));
console.log(Object.is(u("hi"), u("hi")), Object.is(u("hi"), u(7)), Object.is(u(null), u(null)), Object.is(u(null), u(0)));
console.log(Object.is(u(3), 3), Object.is(3, u(3)), Object.is(u("x"), "x"), Object.is(u(null), null), Object.is(u(3), 4));
console.log(Object.is(u(NaN), NaN), Object.is(u(0), -0), Object.is(u(-0), -0));
// A primitive the union cannot hold: constant false.
console.log(Object.is(u(3), true));
const ru: number[] | null = arr;
console.log(Object.is(ru, arr), Object.is(ru, null));

// Object.is drives control flow like any boolean.
const vals = [0, -0, NaN, 1];
let negZeros = 0;
let nans = 0;
for (const v of vals) {
  if (Object.is(v, -0)) negZeros++;
  if (Object.is(v, NaN)) nans++;
}
console.log(negZeros, nans);
