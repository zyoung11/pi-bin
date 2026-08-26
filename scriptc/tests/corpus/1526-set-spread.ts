// Set → array spreads: [...set] in literals (alone, with siblings, both
// element kinds), push(...set), rest-parameter packing, insertion order
// with re-adds and deletes, and the drained array's independence.
const tags = new Set<string>();
tags.add("beta");
tags.add("alpha");
tags.add("beta"); // re-add keeps the first position
tags.add("gamma");
const list = [...tags];
console.log(list.length, list.join(","));
console.log(["start", ...tags, "end"].join("|"));
tags.delete("alpha");
tags.add("delta");
console.log([...tags].join(","));
// The drained array is a fresh copy — later Set mutation is invisible.
const snapshot = [...tags];
tags.add("late");
console.log(snapshot.length, snapshot.includes("late"), tags.size);
// Number elements, including -0/NaN SameValueZero storage.
const ports = new Set([8080, 3000, 8080, 443]);
console.log([...ports].join(" "), [...ports].length);
// push(...set) appends in insertion order.
const acc: number[] = [1];
acc.push(...ports);
console.log(acc.join(","));
// Rest-parameter spread packs the drained elements.
function total(...xs: number[]): number {
  let sum = 0;
  for (const x of xs) sum += x;
  return sum;
}
console.log(total(...ports), total(5, ...ports));
// Empty set drains to an empty array.
const empty = new Set<string>();
console.log([...empty].length, ["only", ...empty].join(""));
// Chains: dedupe-then-sort, the everyday idiom.
const dedup = [...new Set(["b", "a", "c", "a", "b"])];
console.log(dedup.join(""), dedup.sort((x, y) => (x < y ? -1 : 1)).join(""));
