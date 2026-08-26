// Array.prototype.sort with a comparator: in place, returns the receiver,
// STABLE on ties (Node's TimSort is stable; equal-comparing elements keep
// source order byte-exactly). localeCompare — the string comparator the
// sort idiom leans on — returns -1/0/1; inputs here stay same-case ASCII,
// where code-unit order and Node's ICU collation agree.
const nums = [5, 1, 4, 1, 5, 9, 2, 6];
const ret = nums.sort((a, b) => a - b);
console.log(nums.join(","));
// sort returns THE receiver: mutating the result mutates the original.
ret.push(99);
console.log(nums.length, nums[nums.length - 1]);

// Descending, and re-sorting an already-sorted array.
console.log(nums.sort((a, b) => b - a).join(","));
console.log(nums.sort((a, b) => a - b).join(","));

// Strings via localeCompare.
const names = ["delta", "alpha", "charlie", "bravo", "alpha"];
names.sort((a, b) => a.localeCompare(b));
console.log(names.join(","));

// localeCompare itself: -1/0/1, prefixes sort first, digits before
// lowercase letters.
console.log("a".localeCompare("b"), "b".localeCompare("a"), "a".localeCompare("a"));
console.log("ab".localeCompare("abc"), "abc".localeCompare("ab"));
console.log("1".localeCompare("2"), "abd".localeCompare("abc"));

// Stability: equal keys keep their source order (ties in the comparator).
const entries: [string, number][] = [
  ["b", 1],
  ["a", 2],
  ["b", 3],
  ["a", 4],
  ["c", 5],
];
entries.sort((a, b) => a[0].localeCompare(b[0]));
for (const [k, v] of entries) {
  console.log(k, v);
}

// A constant comparator moves nothing (every pair ties).
const keep = [3, 1, 2];
keep.sort(() => 0);
console.log(keep.join(","));

// NaN comparator results hold position like 0 does.
const nan = [2, 1, 3];
nan.sort(() => 0 / 0);
console.log(nan.join(","));

// The [...m.entries()].sort(...) idiom end to end: group, drain, sort,
// re-seed a Map in sorted key order.
const groups = new Map<string, number[]>();
groups.set("cherry", [3]);
groups.set("apple", [1, 11]);
groups.set("banana", [2]);
const sorted = new Map(
  [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
);
for (const [k, v] of sorted) {
  console.log(k, v.length);
}

// Empty and single-element arrays.
const empty: number[] = [];
console.log(empty.sort((a, b) => a - b).length);
console.log([7].sort((a, b) => a - b).join(","));

// Records sort by a field.
const people = [
  { name: "cy", age: 40 },
  { name: "ana", age: 31 },
  { name: "bo", age: 31 },
];
people.sort((a, b) => a.age - b.age);
for (const p of people) {
  console.log(p.name, p.age);
}
