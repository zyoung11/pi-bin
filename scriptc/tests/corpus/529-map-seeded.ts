// Seeded Map construction: `new Map([[k, v], ...])` — the entries array
// literal of pair literals lowers at the construction site (each pair is
// one set() in source order; the tuple array never exists as a value).
const ages = new Map([
  ["ana", 31],
  ["bo", 25],
  ["cy", 40],
]);
console.log(ages.size, ages.get("bo") ?? -1, ages.has("dee"));
ages.forEach((v, k) => {
  console.log(k, v);
});

// A repeated key overwrites, exactly like calling set() twice: the last
// value wins and the key keeps its first insertion position.
const dup = new Map([
  ["x", 1],
  ["y", 2],
  ["x", 3],
]);
console.log(dup.size, dup.get("x") ?? -1);
dup.forEach((v, k) => {
  console.log(k, v);
});

// Number keys, string values; explicit type arguments.
const names = new Map<number, string>([
  [1, "one"],
  [2, "two"],
]);
console.log(names.size, names.get(2) ?? "?");

// Empty entries literal: an empty map.
const empty = new Map<string, number>([]);
console.log(empty.size);

// Keys and values may be arbitrary expressions — evaluated in source
// order, pairwise.
let n = 0;
function next(): number {
  n = n + 1;
  return n;
}
const computed = new Map([
  ["a" + "1", next()],
  ["a2", next() * 10],
]);
console.log(computed.get("a1") ?? -1, computed.get("a2") ?? -1);

// A seeded map is an ordinary map afterwards.
computed.set("a3", 99);
console.log(computed.size, computed.delete("a1"), computed.size);

// Ref values (arrays) move into the map like set()'s.
const rows = new Map([
  ["evens", [2, 4, 6]],
  ["odds", [1, 3]],
]);
const evens = rows.get("evens");
console.log(evens === undefined ? -1 : evens.length);
