// map / filter / forEach callbacks declaring the lib's (element, index,
// array) parameters: the desugared loops pass exactly what the callback
// names, the arguments JS supplies.
const nums = [10, 20, 30];

const indexed = nums.map((x, i) => `${i}=${x}`);
console.log(indexed.join(","));
const withArr = nums.map((x, _i, arr) => x + arr.length);
console.log(withArr.join(","));

const evenIndexes = nums.filter((_x, i) => i % 2 === 0);
console.log(evenIndexes.length, evenIndexes.join(","));
const lastOnly = nums.filter((_x, i, arr) => i === arr.length - 1);
console.log(lastOnly.join(","));

let trace = "";
nums.forEach((x, i) => {
  trace += `${i}:${x};`;
});
console.log(trace);
nums.forEach((_x, i, arr) => {
  if (i === 0) console.log("len", arr.length);
});

// Zero-parameter callbacks are ordinary TS too.
let count = 0;
nums.forEach(() => {
  count += 1;
});
console.log(count);
console.log(nums.map(() => "x").join(""));

// Record elements with indexes; the array parameter is the receiver
// itself (same reference), so mutation through it is visible after.
const rows = [{ v: 1 }, { v: 2 }];
const labeled = rows.map((r, i) => ({ label: `${i}`, v: r.v }));
for (const l of labeled) console.log(l.label, l.v);
const seen: number[] = [];
rows.forEach((r, i, arr) => {
  seen.push(r.v + i + arr.length);
});
console.log(seen.join(","));
