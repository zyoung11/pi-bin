// Logical operators over union-typed values keep JS VALUE semantics: the
// result is the deciding operand itself, still the union. In condition
// position, mixed operand kinds (`u && flag`) test fine — ToBoolean of each
// side, short-circuiting preserved.

function pick(a: string | undefined, b: string | undefined): string | undefined {
  return a || b;
}
console.log(pick("x", "y") ?? "(u)");
console.log(pick("", "y") ?? "(u)");
console.log(pick(undefined, "y") ?? "(u)");
console.log(pick("", undefined) === undefined);
console.log(pick(undefined, undefined) === undefined);

function both(a: string | undefined, b: string | undefined): string | undefined {
  return a && b;
}
console.log(both("x", "y") ?? "(u)");
console.log(both("", "y") === "");
console.log(both(undefined, "y") === undefined);
console.log(both("x", undefined) === undefined);

// A plain arm value on one side coerces into the union (`u || undefined` —
// the real-CLI idiom `rawText?.trim() || undefined`).
function normalize(u: string | undefined): string | undefined {
  return u || undefined;
}
console.log(normalize("keep") ?? "(u)", normalize("") === undefined, normalize(undefined) === undefined);

// Number arms: 0 and NaN take the right side of ||, the left of &&.
function orNum(a: number | undefined, b: number | undefined): number | undefined {
  return a || b;
}
const nan = 0 / 0;
console.log(orNum(5, 9) ?? -1, orNum(0, 9) ?? -1, orNum(nan, 9) ?? -1, orNum(undefined, 9) ?? -1);

// Short-circuit: the right operand must NOT evaluate when the left decides.
let evals = 0;
function side(v: string | undefined): string | undefined {
  evals++;
  return v;
}
const keep = side("left") || side("right");
console.log(keep ?? "(u)", evals);
evals = 0;
const dropped = side(undefined) && side("right");
console.log(dropped === undefined, evals);

// Mixed kinds in CONDITION position: union && boolean, union || boolean —
// no value representation needed, ToBoolean per operand.
function gate(u: string | undefined, ok: boolean): string {
  if (u && ok) return "both";
  if (u || ok) return "one";
  return "neither";
}
console.log(gate("x", true), gate("x", false), gate(undefined, true), gate("", false));

// Chained conditions with narrowing on the right (`!u || u === "lit"`).
function accept(u: string | undefined): boolean {
  if (!u || u === "all") return true;
  return u.length > 3;
}
console.log(accept(undefined), accept("all"), accept("hi"), accept("long-enough"));

// Ternary condition over a union.
function label(u: number | null): string {
  return u ? `n=${u}` : "empty";
}
console.log(label(4), label(0), label(null));

// Record arms are always truthy: `u && v` picks v whenever u is a record.
interface Opts {
  q: boolean;
}
function choose(u: Opts | undefined, v: Opts | undefined): Opts | undefined {
  return u && v;
}
const o1: Opts = { q: true };
const o2: Opts = { q: false };
const chosen = choose(o1, o2);
console.log(chosen ? `q=${chosen.q}` : "none");
console.log(choose(undefined, o2) === undefined);
