// Whole-union truthiness: `if (u)` / `!u` / ternary conditions test the ARM
// value's ToBoolean — unit arms are falsy; a string arm is falsy iff empty;
// a number arm is falsy iff 0/-0/NaN; a boolean arm by its value; object
// arms (records, arrays, functions) are ALWAYS truthy, empty or not.

function tag(u: string | undefined): string {
  if (u) return `truthy:${u}`;
  return "falsy";
}
console.log(tag("hello"));
console.log(tag(""));
console.log(tag(undefined));

function bang(u: string | null): boolean {
  return !u;
}
console.log(bang("x"), bang(""), bang(null));

function num(u: number | undefined): string {
  return u ? `yes:${u}` : "no";
}
const nan = 0 / 0;
console.log(num(3), num(0), num(-0), num(nan), num(undefined), num(1.5));

function flag(u: boolean | null): string {
  if (u) return "on";
  if (u === false) return "off";
  return "unset";
}
console.log(flag(true), flag(false), flag(null));

// Object arms are always truthy — the empty array and empty-string-free
// record included.
function arr(u: number[] | undefined): string {
  return u ? `arr:${u.length}` : "none";
}
const empty: number[] = [];
console.log(arr(empty), arr([1, 2]), arr(undefined));

interface Box {
  label: string;
}
function rec(u: Box | null): string {
  return u ? `box:${u.label}` : "null";
}
console.log(rec({ label: "b" }), rec(null));

// while over a union condition: drain a string|undefined cursor.
let cursor: string | undefined = "abc";
let steps = 0;
while (cursor) {
  steps++;
  cursor = cursor.length > 1 ? cursor.slice(1) : undefined;
}
console.log("steps", steps);

// Three-arm unions: every arm kind through one helper.
function three(u: string | number | undefined): string {
  return u ? "t" : "f";
}
console.log(three("a"), three(""), three(7), three(0), three(nan), three(undefined));

// Narrowing STILL works after a truthiness test: tsc narrows u inside the
// branch, and the read bridges through unionNarrow as before.
function shout(u: string | undefined): string {
  if (u) {
    return u + "!" + u.length;
  }
  return "(nothing)";
}
console.log(shout("quiet"), shout(undefined), shout(""));
