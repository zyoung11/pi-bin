// Array.prototype.slice — a fresh shallow copy, JS-exact index handling:
// omitted/negative/out-of-range/fractional indices, empty results, ref
// elements retained (the SAME references — mutations through the copy's
// records are visible via the original), and the parseMac idiom
// (split(":").slice(0, 16).map(...)).
const nums = [10, 20, 30, 40, 50];
console.log(JSON.stringify(nums.slice()));
console.log(JSON.stringify(nums.slice(2)));
console.log(JSON.stringify(nums.slice(1, 3)));
console.log(JSON.stringify(nums.slice(-2)));
console.log(JSON.stringify(nums.slice(1, -1)));
console.log(JSON.stringify(nums.slice(-4, -2)));
console.log(JSON.stringify(nums.slice(3, 1)));
console.log(JSON.stringify(nums.slice(0, 99)));
console.log(JSON.stringify(nums.slice(-99)));
console.log(JSON.stringify(nums.slice(1.7, 3.2)));

// The copy is FRESH: mutating it never touches the source.
const copy = nums.slice(0, 2);
copy.push(999);
copy[0] = -1;
console.log(JSON.stringify(nums), JSON.stringify(copy));

// String elements, and the parseMac idiom from lan-ip.ts.
function parseMac(macStr: string): number[] {
  return macStr
    .split(/:/)
    .slice(0, 16)
    .map((seq) => seq.length);
}
console.log(JSON.stringify(parseMac("2a:27:c1:a6:62:0e")));
console.log(JSON.stringify("a,b,c,d,e".split(/,/).slice(1, -1)));

// Ref elements are SHALLOW-copied: the same record references.
interface Row {
  id: number;
  tag: string;
}
const rows: Row[] = [
  { id: 1, tag: "a" },
  { id: 2, tag: "b" },
  { id: 3, tag: "c" },
];
const tail = rows.slice(1);
tail[0].tag = "mutated";
console.log(rows[1].tag, tail.length, tail[1].id);

// Nested arrays slice too (same inner references).
const grid = [[1, 2], [3, 4], [5, 6]];
const mid = grid.slice(1, 2);
mid[0].push(99);
console.log(JSON.stringify(grid));

// Slicing an empty array, and chaining off a slice.
const empty: number[] = [];
console.log(JSON.stringify(empty.slice(0, 5)), nums.slice(1, 4).slice(-1)[0]);
