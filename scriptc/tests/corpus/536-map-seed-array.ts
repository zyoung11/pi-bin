// `new Map(entries)` from a tuple-array VALUE (not just the pair-literal
// form): Node iterates the pairs in insertion order and a later duplicate
// key overwrites the earlier value while keeping the FIRST occurrence's
// insertion position.
const pairs: [string, number][] = [
  ["a", 1],
  ["b", 2],
  ["a", 3],
];
const m = new Map(pairs);
console.log(m.size, m.get("a") ?? -1, m.get("b") ?? -1);
m.forEach((v, k) => console.log(k, v));

// The map is independent bookkeeping over the same pairs: mutating the
// seed array afterwards changes nothing in the map.
pairs.push(["c", 9]);
console.log(m.size, m.has("c"));

// A seeded map is an ordinary map afterwards.
m.set("d", 4);
console.log(m.size, m.delete("a"), m.size);

// The seed may be any tuple-array expression — here one produced by map().
const names = ["x", "y", "z"];
const m2 = new Map(names.map((n, i): [string, number] => [n, i * 10]));
console.log(m2.size, m2.get("y") ?? -1, m2.get("z") ?? -1);

// Number keys with SameValueZero collapsing: -0 seeds as +0, duplicate
// NaN... stays out (NaN keys need the f64 normalization; keep to -0 here).
const nums: [number, string][] = [
  [-0, "zero"],
  [1, "one"],
  [0, "zero again"],
];
const mn = new Map(nums);
console.log(mn.size, mn.get(0) ?? "?", mn.get(1) ?? "?");

// Ref values ride in by reference, like set(): the map's value IS the
// seeded array object.
const rows: [string, number[]][] = [
  ["evens", [2, 4]],
  ["odds", [1, 3, 5]],
];
const mr = new Map(rows);
const odds = mr.get("odds");
console.log(odds === undefined ? -1 : odds.length);

// An empty tuple-array value seeds an empty map.
const none: [string, number][] = [];
console.log(new Map(none).size);
