// node:querystring.parse — separators and maxKeys (Node is the oracle).
// Custom sep/eq including multi-character and multi-byte sequences (the
// scan's naive partial-match resets are quirk-faithful: an overlapping
// partial match is NOT re-examined, Node's own behavior), the falsy rule
// (null/undefined/'' all mean the defaults), and maxKeys' pair budget —
// which empty skipped segments consume too, and which 0 and negatives
// remove entirely (Node's `maxKeys > 0 ? maxKeys : -1`).
import { parse } from "node:querystring";

// Custom separators.
console.log("S1", JSON.stringify(parse("a:1;b:2", ";", ":")));
console.log("S2", JSON.stringify(parse("a::1;;b::2", ";;", "::")));
console.log("S3", JSON.stringify(parse("aXYb=1XYXc=2", "XYX")));
console.log("S4", JSON.stringify(parse("a==b=c===d", undefined, "==")));
console.log("S5", JSON.stringify(parse("a=1&b=2", "", "")));
console.log("S6", JSON.stringify(parse("a☃1;b☃2", ";", "☃")));
console.log("S7", JSON.stringify(parse("aabX=1", "ab")));
console.log("S8", JSON.stringify(parse("a=1&b=2", null, null)));
console.log("S9", JSON.stringify(parse("x🌍y=1&z=2", null, "🌍")));

// maxKeys: the pair budget.
console.log("M1", JSON.stringify(parse("a=1&b=2&c=3", null, null, { maxKeys: 2 })));
console.log("M2", JSON.stringify(parse("a=1&b=2", null, null, { maxKeys: 0 })));
console.log("M3", JSON.stringify(parse("&&&a=1&b=2", null, null, { maxKeys: 2 })));
console.log("M4", JSON.stringify(parse("a=1&&b=2&c=3", null, null, { maxKeys: 2 })));
console.log("M5", JSON.stringify(parse("a=1&b=2&c=3", null, null, { maxKeys: -5 })));
console.log("M6", JSON.stringify(parse("a=1&a=2&a=3&b=4", null, null, { maxKeys: 3 })));
console.log("M7", JSON.stringify(parse("a=1&b=2&c=3", null, null, { maxKeys: Infinity })));
console.log("M8", JSON.stringify(parse("a=1&b=2&c=3", null, null, { maxKeys: 1000 })));
console.log("M9", JSON.stringify(parse("a:1;b:2;c:3", ";", ":", { maxKeys: 2 })));

// A runtime maxKeys expression (the budget lives in the runtime).
let budget = 1;
budget += 1;
console.log("M10", JSON.stringify(parse("a=1&b=2&c=3", null, null, { maxKeys: budget })));
