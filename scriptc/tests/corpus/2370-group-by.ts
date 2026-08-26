// Object.groupBy / Map.groupBy (ES2024): groups form in first-encounter
// order, later hits push onto the live group arrays, the callback's index
// parameter counts every element, and Map keys stay typed under
// SameValueZero while Object keys are property keys (numbers stringify).
const nums = [1, 2, 3, 4, 5, 6, 7];
const m = Map.groupBy(nums, (n) => (n % 3 === 0 ? "fizz" : "plain"));
console.log(m.size, [...m.keys()].join(","), (m.get("fizz") ?? []).join(","), (m.get("plain") ?? []).join(","));
const byIdx = Map.groupBy(nums, (n, i) => i % 2);
console.log([...byIdx.keys()].join(","), (byIdx.get(0) ?? []).join(","), (byIdx.get(1) ?? []).join(","));
// -0 keys coerce to +0 (CoerceKey), so both reads hit one group.
const mz = Map.groupBy([1, 2], (n) => (n === 1 ? -0 : 0));
console.log(mz.size, (mz.get(0) ?? []).join(","), (mz.get(-0) ?? []).join(","));
const g: Partial<Record<string, number[]>> = Object.groupBy(nums, (n) => (n % 2 === 0 ? "even" : "odd"));
console.log(Object.keys(g).join(","), (g["odd"] ?? []).join(","), (g["even"] ?? []).join(","));
// Number keys become string property keys.
const gn: Partial<Record<string, number[]>> = Object.groupBy(nums, (n) => n % 3);
console.log(Object.keys(gn).join(","), (gn["0"] ?? []).join(","), (gn["1"] ?? []).join(","), (gn["2"] ?? []).join(","));
// Encounter order differs from sorted order.
const words = ["delta", "alpha", "dog", "apple", "zebra"];
const byFirst: Partial<Record<string, string[]>> = Object.groupBy(words, (w) => w.charAt(0));
const dRead = byFirst["d"];
const dWords: string[] = dRead !== undefined ? dRead : [];
const zRead = byFirst["z"];
const zWords: string[] = zRead !== undefined ? zRead : [];
console.log(Object.keys(byFirst).join(","), dWords.join("|"), zWords.join("|"));
// Empty inputs and single-group inputs.
const empty: number[] = [];
console.log(Map.groupBy(empty, (n) => n).size, Object.keys(Object.groupBy(empty, (n): string => String(n))).length);
const one = Map.groupBy(nums, () => "all");
console.log(one.size, (one.get("all") ?? []).join(","));
// The stored arrays are the live groups: Object.values sees the pushes.
const vals = Object.values(g);
let total = 0;
for (const arr of vals) if (arr !== undefined) total += arr.length;
console.log(vals.length, total);
