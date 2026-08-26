// Record key order is DECLARED order — JS insertion order — on every
// order-observing surface, differentially vs Node: JSON.stringify (nested
// records included: the canonical name-sorted struct layout must never
// leak into output), Object.keys/values/entries, util.inspect, and the
// pretty-print form. Every shape here declares its fields in a
// deliberately NON-alphabetical order so a sorted walk cannot pass.
import { inspect } from "node:util";

// The original divergence: a record nested inside another literal.
const obj = { foo: 1, bar: { baz: 2, aaa: 3 } };
console.log(JSON.stringify(obj));

// Records nested in arrays.
const arr = [{ zed: 1, alpha: 2 }, { zed: 3, alpha: 4 }];
console.log(JSON.stringify(arr));

// Records nested in tuples (the tuple itself is a JSON array).
const tup: [string, { yy: number; xx: number }] = ["t", { yy: 1, xx: 2 }];
console.log(JSON.stringify(tup));

// Optional (undefined-armed) fields drop without disturbing the order of
// the present keys.
const opt: { zulu?: number; mike: string; alpha?: boolean } = { mike: "m", alpha: true };
console.log(JSON.stringify(opt));

// Records as union arms keep their own declared order.
type U = { kind: "b"; beta: number; aa: number } | { kind: "a"; omega: string };
const u: U = { kind: "b", beta: 1, aa: 2 };
console.log(JSON.stringify(u));

// Spread-built records: spread keys land at the spread's position, the
// explicit key appends after them.
const base = { zz: 1, mm: 2 };
const spread = { ...base, aa: 3 };
console.log(JSON.stringify(spread));

// Object.keys/values/entries answer declared order, nested records too.
const nested = { outer: { yy: 1, xx: 2 }, second: 5 };
console.log(Object.keys(nested).join(","));
console.log(Object.keys(nested.outer).join(","));
console.log(JSON.stringify(Object.entries(nested.outer)));
console.log(Object.values(nested.outer).join(","));

// util.inspect renders declared order at every depth.
console.log(inspect(nested));

// Pretty-print rides the same serializer — same order.
console.log(JSON.stringify(obj, null, 2));

// Index-signature shapes: declared fields first (declared order), then
// runtime extras in insertion order — which IS Node's order when the
// extras are written after construction.
const idx: { zeta: number; [k: string]: number } = { zeta: 1 };
idx["extra"] = 2;
idx["another"] = 3;
console.log(JSON.stringify(idx));

// A literal written in the SAME order its alias declares stays exact.
// (A literal written in a DIFFERENT order than its shape declares keeps
// the shape's declared order — SEMANTICS.md 36's documented divergence —
// so corpus programs construct in declaration order.)
type T = { first: string; second: number };
const t: T = { first: "f", second: 2 };
console.log(JSON.stringify(t));
