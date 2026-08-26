// `u || d` where the checker types the result as ANOTHER union: the falsy
// arms of the left are DROPPED from that result (`string | undefined` on
// the left of `|| null` gives `string | null`), so the left cannot be
// retagged into it before the test — the value being ruled out is the one
// with no home. Single-eval with the retag on the truthy side only.
// SCRIPTC_TEST_ENV is set by the harness on both sides; the UNSET name is
// absent from both, so the falsy side is exercised value-exactly.

const unset: string | null = process.env.SCRIPTC_DEFINITELY_NOT_SET_12345 || null;
console.log(unset);
const set: string | null = process.env.SCRIPTC_TEST_ENV || null;
console.log(set !== null, set !== null ? set : "<absent>");

// A target with NO unit arm at all: nothing falsy exists in `string |
// number` to stand in for the dropped `undefined`, which is why the answer
// cannot be a substituted value on the falsy side.
const port: string | number = process.env.SCRIPTC_DEFINITELY_NOT_SET_12345 || 3000;
console.log(port);
const port2: string | number = process.env.SCRIPTC_TEST_ENV || 3000;
console.log(typeof port2);

// Truthiness, not nullishness: an EMPTY string takes the default, where
// `??` keeps it. The whole reason `||` needs its own node next to nullish.
process.env.SCRIPTC_OR_EMPTY = "";
const empty: string | null = process.env.SCRIPTC_OR_EMPTY || null;
const kept: string | undefined = process.env.SCRIPTC_OR_EMPTY ?? undefined;
console.log(empty, kept === "");

// The left evaluates exactly ONCE and the right stays lazy.
let reads = 0;
function read(): string | undefined {
  reads++;
  return undefined;
}
let defaults = 0;
function fallbackValue(): number {
  defaults++;
  return 1;
}
const lazy: string | number = read() || fallbackValue();
console.log(reads, defaults, lazy);

const truthy: string | number = process.env.SCRIPTC_TEST_ENV || fallbackValue();
console.log(defaults, typeof truthy);

// Chained: each link retags into the same result union.
const chained: string | number =
  process.env.SCRIPTC_DEFINITELY_NOT_SET_12345 || process.env.SCRIPTC_ALSO_NOT_SET_12345 || 42;
console.log(chained);

// A left with SEVERAL non-unit arms — the retag maps them all, which the
// single-arm extraction shape of a plain `orDefault` could not do.
function multi(pick: number): string | number | undefined {
  if (pick === 0) return "s";
  if (pick === 1) return 0;
  return undefined;
}
const m0: string | number | boolean = multi(0) || false;
const m1: string | number | boolean = multi(1) || false;
const m2: string | number | boolean = multi(2) || false;
console.log(m0, m1, m2);

// `&&` keeps the eager shape: there the falsy left IS the result, so the
// checker keeps its arms in the target and they must coerce.
function andPick(u: string | undefined): string | undefined | number {
  return u && 7;
}
console.log(andPick(undefined) === undefined, andPick("x"));

// Refcount stress: the truthy side hands the box to the helper (which
// consumes it), the falsy side releases it — a thousand of each.
let live = 0;
for (let i = 0; i < 1000; i++) {
  const each: string | null = (i % 2 === 0 ? process.env.SCRIPTC_TEST_ENV : undefined) || null;
  if (each !== null) live += each.length;
}
console.log(live > 0);
