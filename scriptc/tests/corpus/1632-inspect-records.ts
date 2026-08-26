// util.inspect over records: key rendering (bare identifiers vs quoted),
// declaration-order fields, nesting with the compact-3 heuristic, the
// exact 80-column break edges, long string values splitting at their
// nesting indentation, and undefined-armed optional fields. Node is the
// oracle byte-for-byte.
import { inspect } from "node:util";

console.log(inspect({}));
console.log(inspect({ a: 1 }));
console.log(inspect({ a: 1, b: "two", c: true }));
console.log(inspect({ "a-b": 1, "k l": 2, ok_1: 3, "": 4 }));
console.log(inspect({ "it's": 1, 'say "hi"': 2 }));

// nesting: compact-3 keeps shallow subtrees inline, deep ones break
console.log(inspect({ a: { b: { c: {} } } }));
console.log(inspect({ a: { b: { c: { d: 1 } } } }));
console.log(inspect({ first: [1, 2, 3], second: { inner: [1, 2, 3] } }));
console.log(inspect({ deep: { deeper: { deepest: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] } } }));

// the 80-column break edges (start = entries + indent + braces + 10)
console.log(inspect({ key: "v".repeat(60) }));
console.log(inspect({ key: "v".repeat(61) }));
console.log(inspect({ key: "v".repeat(62) }));
console.log(inspect({ key: "v".repeat(63) }));
console.log(inspect({ aaaa: 1, bbbb: 2, cccc: 3, dddd: 4, eeee: 5, ffff: 6, gggg: 7, hhhh: 8 }));
console.log(
  inspect({ nested: { one: "aaaaaaaaaaaaaaaaaaaa", two: "bbbbbbbbbbbbbbbbbbbb", three: "cccccccccccccccccccc" } }),
);

// long string values split at their own indentation level
console.log(inspect({ s: "x".repeat(75) + "\ny" }));
console.log(inspect({ outer: { s: "pad pad pad pad pad pad pad pad pad pad\npad pad pad pad pad pad pad pad" } }));

// optional fields hold the undefined arm (the field EXISTS — Node prints it)
interface Opt {
  a: number | undefined;
  b: string | null;
}
const opt: Opt = { a: undefined, b: null };
console.log(inspect(opt));

// records inside arrays inside records
console.log(inspect({ list: [{ id: 1 }, { id: 2 }], tag: "end" }));
console.log(inspect([{ name: "first", values: [1, 2, 3] }, { name: "second", values: [4, 5, 6] }]));

// depth options over records
const deepRec = { l1: { l2: { l3: { l4: { l5: 1 } } } } };
console.log(inspect(deepRec, { depth: 0 }));
console.log(inspect(deepRec, { depth: 4 }));
console.log(inspect(deepRec, { depth: null }));
