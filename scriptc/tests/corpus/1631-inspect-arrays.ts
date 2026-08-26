// util.inspect over arrays: the single-line/multi-line break at
// breakLength 80, the >6-entry grid grouping (padStart for all-number
// arrays, padEnd otherwise), the 100-item cap with "... N more items",
// depth placeholders, and union-element arrays. Node is the oracle.
import { inspect } from "node:util";

const empty: number[] = [];
console.log(inspect(empty));
console.log(inspect([1]));
console.log(inspect([1, 2, 3]));
console.log(inspect([1, 2, 3, 4, 5, 6]));
console.log(inspect([1, 2, 3, 4, 5, 6, 7]));

// grids: number arrays right-align, string arrays left-align
const numbers: number[] = [];
for (let i = 0; i < 26; i++) numbers.push(i);
console.log(inspect(numbers));
const hundred: number[] = [];
for (let i = 0; i < 100; i++) hundred.push(i * 3);
console.log(inspect(hundred));
const overflow: number[] = [];
for (let i = 0; i < 137; i++) overflow.push(i);
console.log(inspect(overflow));
const strings: string[] = [];
for (let i = 0; i < 30; i++) strings.push(`str-${i}`);
console.log(inspect(strings));

// entries too long for the grid: one per line
const long: string[] = [];
for (let i = 0; i < 12; i++) long.push("0123456789012345678901234567890123456789");
console.log(inspect(long));

// nesting and depth placeholders (default depth 2)
console.log(inspect([[1, [2, [3, [4]]]]]));
const emptyNest: number[][][][] = [[[[]]]];
console.log(inspect(emptyNest));
console.log(inspect([{ a: 1 }, { b: [1, 2] }]));

// union elements: the grid order flips to padEnd on the first non-number
const mixed: (number | string | boolean | null)[] = [1, "two", true, null, 5];
console.log(inspect(mixed));
const mixedWide: (number | string)[] = [];
for (let i = 0; i < 14; i++) mixedWide.push(i % 3 === 0 ? `s${i}` : i);
console.log(inspect(mixedWide));

// exactly at the more-items pluralization boundary
const oneOver: number[] = [];
for (let i = 0; i < 101; i++) oneOver.push(i);
console.log(inspect(oneOver));

// tuples are arrays to Node
const pair: [number, string] = [1, "a"];
console.log(inspect(pair));
const nestedTuple: [number, [string, boolean]] = [7, ["x", false]];
console.log(inspect(nestedTuple));

// options: depth
console.log(inspect([[1], [2]], { depth: 0 }));
console.log(inspect([1, 2], { depth: -1 }));
console.log(inspect([[[[[1]]]]], { depth: 5 }));
console.log(inspect([[[[[1]]]]], { depth: null }));
console.log(inspect([1, 2], { colors: false, compact: 3, breakLength: 80 }));
