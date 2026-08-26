// `===`/`!==` between same-union values: tag equality plus arm-value
// equality — string arms by bytes, number arms with JS number rules
// (NaN !== NaN, +0 === -0), unit arms equal iff the SAME unit, and object
// arms by reference identity. A union compared against a plain arm value
// (`u === "text"`) wraps the plain side, payload identity preserved.

function eq(a: string | undefined, b: string | undefined): boolean {
  return a === b;
}
console.log(eq("x", "x"), eq("x", "y"), eq("x", undefined), eq(undefined, undefined), eq("", ""));

function neq(a: number | null, b: number | null): boolean {
  return a !== b;
}
const nan = 0 / 0;
console.log(neq(1, 1), neq(1, 2), neq(0, -0), neq(nan, nan), neq(null, null), neq(0, null));

// undefined and null are DIFFERENT arms: never strictly equal.
function unit(a: string | undefined | null, b: string | undefined | null): boolean {
  return a === b;
}
console.log(unit(undefined, null), unit(null, null), unit(undefined, undefined), unit("s", "s"));

// Union vs plain literal where the checker does NOT narrow (the comparison
// result is stored, not used as a guard).
function isText(u: string | undefined): boolean {
  const hit = u === "text";
  return hit;
}
console.log(isText("text"), isText("other"), isText(undefined), isText(""));

function isFive(u: number | null): boolean {
  return u === 5;
}
console.log(isFive(5), isFive(4), isFive(null));

// Boolean arms.
function boolEq(a: boolean | undefined, b: boolean | undefined): boolean {
  return a === b;
}
console.log(boolEq(true, true), boolEq(true, false), boolEq(undefined, false), boolEq(undefined, undefined));

// Object arms compare by REFERENCE identity, exactly like JS.
interface P {
  n: number;
}
function same(a: P | null, b: P | null): boolean {
  return a === b;
}
const p1: P = { n: 1 };
const p2: P = { n: 1 };
console.log(same(p1, p1), same(p1, p2), same(p1, null), same(null, null));

// Array arms: identity, not contents.
function sameArr(a: number[] | undefined, b: number[] | undefined): boolean {
  return a === b;
}
const xs = [1, 2];
console.log(sameArr(xs, xs), sameArr(xs, [1, 2]), sameArr(undefined, undefined), sameArr(xs, undefined));

// Union vs plain VARIABLE of an arm type (not a literal).
function findsName(u: string | undefined, name: string): boolean {
  return u === name;
}
console.log(findsName("ada", "ada"), findsName(undefined, "ada"), findsName("x", "ada"));

// !== spelling over the same helper.
function changed(prev: string | undefined, next: string | undefined): boolean {
  return prev !== next;
}
console.log(changed("a", "a"), changed("a", "b"), changed(undefined, "b"), changed(undefined, undefined));

// Three-arm mixed-kind union.
function tri(a: string | number | undefined, b: string | number | undefined): boolean {
  return a === b;
}
console.log(tri("1", "1"), tri(1, 1), tri("1", 1), tri(1, undefined), tri(undefined, undefined));
