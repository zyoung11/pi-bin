// Spread, three positions: array literals (`[...a, b]` — a FRESH array,
// sources untouched), calls into REST parameters (`f(...xs)` — the rest
// pack copies), and `a.push(...src)` (append in order, count snapshotted
// first so `a.push(...a)` duplicates like JS). Object spread of known
// record shapes copies field-by-field with last-write-wins.

const head: number[] = [1, 2];
const tail: number[] = [4, 5];
const joined = [...head, 3, ...tail];
console.log(joined.join(","), joined.length);
// Fresh array: mutating the result never touches the sources.
joined.push(99);
console.log(head.join(","), tail.join(","));

const words: string[] = ["b", "c"];
const packed = ["a", ...words];
console.log(packed.join("-"));

// Rest-parameter calls: plain surplus and spreads mix, in order.
function sum(label: string, ...nums: number[]): string {
  let total = 0;
  for (const n of nums) {
    total = total + n;
  }
  return `${label}:${total}:${nums.length}`;
}
console.log(sum("all", ...head));
console.log(sum("mixed", 10, ...head, 20, ...tail));
console.log(sum("none"));

// The rest pack is a fresh copy: callee mutations never alias the caller's.
function grow(...xs: number[]): number {
  xs.push(1000);
  return xs.length;
}
console.log(grow(...head), head.length);

// push(...src): appends in order, returns the new length.
const meta: string[] = ["x"];
const tags: string[] = ["t1", "t2"];
console.log(meta.push(...tags));
console.log(meta.join(","));

// push(...self): the count snapshots first — duplicates, like JS.
const dup: number[] = [7, 8];
console.log(dup.push(...dup), dup.join(","));

// Empty spreads are fine everywhere.
const none: number[] = [];
const noneStr: string[] = [];
console.log([...none, 42].length, sum("empty", ...none), meta.push(...noneStr));

// Object spread: field-by-field copy of a known shape; explicit properties
// AFTER the spread override (last write wins).
interface Cfg {
  host: string;
  port: number;
  quiet: boolean;
}
const base: Cfg = { host: "localhost", port: 80, quiet: false };
const overridden: Cfg = { ...base, port: 8080 };
console.log(overridden.host, overridden.port, overridden.quiet);
// The copy is a fresh record — writes don't flow back.
overridden.host = "elsewhere";
console.log(base.host);

// Two spreads: the later one wins per field.
const alt: Cfg = { host: "alt", port: 9, quiet: true };
const merged: Cfg = { ...base, ...alt };
console.log(merged.host, merged.port, merged.quiet);

// Spread + optional fields: the spread fills what it has; explicit values
// override; reference fields alias (records are references).
interface WithOpt {
  name: string;
  note?: string;
}
const src: WithOpt = { name: "n" };
const copy: WithOpt = { ...src, note: "added" };
console.log(copy.name, copy.note === undefined ? "(none)" : copy.note, src.note === undefined);
