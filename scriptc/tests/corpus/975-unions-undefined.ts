// `T | undefined` unions: construction from both sides, `!== undefined` /
// `=== undefined` narrowing in both branches, params, returns, globals.

function greet(name: string | undefined): string {
  if (name === undefined) {
    return "hello, stranger";
  }
  return "hello, " + name;
}
console.log(greet("ada"));
console.log(greet(undefined));

function firstLong(words: string[]): string | undefined {
  for (const w of words) {
    if (w.length > 4) {
      return w;
    }
  }
  return undefined;
}
const found = firstLong(["tiny", "gigantic", "big"]);
if (found !== undefined) {
  console.log("found", found, found.length);
} else {
  console.log("none");
}
const missing = firstLong(["a", "b"]);
console.log(missing === undefined);
console.log(missing !== undefined);

// Early-return pattern: the tail of the function sees the narrowed arm.
function orDefault(v: number | undefined, dflt: number): number {
  if (v === undefined) {
    return dflt;
  }
  return v + 0;
}
console.log(orDefault(3, 9));
console.log(orDefault(undefined, 9));

// A module-scope union global, reassigned across both arms.
let last: string | undefined = undefined;
function remember(s: string): void {
  last = s;
}
console.log(last === undefined);
remember("kept");
console.log(last !== undefined);

// Ternaries wrap each arm; double-checks fold on the narrowed side.
function pick(n: number): string | undefined {
  return n > 0 ? "pos" : undefined;
}
const p = pick(1);
if (p !== undefined) {
  console.log(p, p !== undefined);
}

// boolean | undefined exercises the scalar (payload-in-slot) arms.
function maybeFlag(n: number): boolean | undefined {
  if (n === 0) {
    return undefined;
  }
  return n > 0;
}
const f = maybeFlag(5);
if (f !== undefined) {
  console.log("flag", f);
}
console.log(maybeFlag(0) === undefined);
