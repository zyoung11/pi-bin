// Nullish coalescing: ONLY null/undefined take the default — 0, "", and
// false do NOT (the difference from ||); the right side is lazy; ??=.

function pick(n: number): string | undefined {
  return n > 0 ? "yes" : undefined;
}
console.log(pick(1) ?? "default");
console.log(pick(-1) ?? "default");

// falsy non-nullish values pass through: 0, "", false
const zero: number | undefined = 0;
console.log(zero ?? 99);
const empty: string | undefined = "";
console.log((empty ?? "fallback").length);
const off: boolean | undefined = false;
console.log(off ?? true);

// ...but undefined takes the default
const missing: number | undefined = undefined;
console.log(missing ?? 99);

// null arms trigger too
const gone: string | null = null;
console.log(gone ?? "was null");
const there: string | null = "here";
console.log(there ?? "was null");

// three-way: string | null | undefined narrows past both units
function tri(n: number): string | null | undefined {
  if (n === 0) return null;
  if (n === 1) return undefined;
  return "value";
}
console.log(tri(0) ?? "unit");
console.log(tri(1) ?? "unit");
console.log(tri(2) ?? "unit");

// the right side is LAZY: the default only evaluates when needed
let calls = 0;
function expensive(): string {
  calls = calls + 1;
  return "computed";
}
const present: string | undefined = "cheap";
console.log(present ?? expensive(), calls);
const absent: string | undefined = undefined;
console.log(absent ?? expensive(), calls);

// pass-through shape: both sides optional, the result stays optional
function first(a: string | undefined, b: string | undefined): string | undefined {
  return a ?? b;
}
console.log(first("x", "y") ?? "!");
console.log(first(undefined, "y") ?? "!");
console.log(first(undefined, undefined) ?? "!");

// chains associate left: (a ?? b) ?? c
console.log(first(undefined, undefined) ?? first(undefined, "mid") ?? "last");

// the bread-and-butter patterns: env reads and map gets
const fromEnv = process.env.SCRIPTC_TEST_SURELY_UNSET ?? "env-default";
console.log(fromEnv);
const m = new Map<string, number>();
m.set("a", 1);
console.log(m.get("a") ?? -1, m.get("b") ?? -1);

// optional record fields
interface Opts {
  label?: string;
  width?: number;
}
function describe(o: Opts): string {
  return (o.label ?? "unlabeled") + ":" + (o.width ?? 80);
}
console.log(describe({ label: "big", width: 120 }));
console.log(describe({}));

// scalar payloads through the narrowed shape
const b: boolean | undefined = undefined;
console.log(b ?? false);
const n: number | undefined = 3.5;
console.log((n ?? 0) + 1);

// ??= on locals: assigns only when nullish, RHS lazy
let slot: string | undefined = undefined;
slot ??= "filled";
console.log(slot);
let kept: string | undefined = "original";
kept ??= expensive();
console.log(kept, calls);
let numSlot: number | undefined;
numSlot ??= 7;
console.log(numSlot ?? -1);

// an uninitialized undefined-armed let IS undefined (readable immediately)
function localUninit(): string {
  let pending: string | undefined;
  console.log(pending === undefined, pending ?? "unset");
  if (1 > 0) pending = "set";
  return pending ?? "never";
}
console.log(localUninit());
let globalUninit: string | undefined;
console.log(globalUninit === undefined, globalUninit ?? "unset");

// ??= keeps falsy non-nullish values
let z: number | undefined = 0;
z ??= 42;
console.log(z);

// a non-nullable left folds statically: the default never evaluates
const solid: string = "solid";
console.log(solid ?? expensive(), calls);
let solidVar = "start";
solidVar ??= expensive();
console.log(solidVar, calls);
