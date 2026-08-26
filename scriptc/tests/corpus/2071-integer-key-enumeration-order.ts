// JS own-key enumeration order (OrdinaryOwnPropertyKeys): canonical array
// indices first in ascending numeric order, then string keys in insertion
// order. Records reproduce it wherever keys enumerate — Object.keys/
// values/entries, JSON.stringify, and spread copies.

enum E {
  member, // 0
}

const o = { b: 1, [E.member]: 2, "10": 3, a: 4, [1.5]: 5 };
console.log(Object.keys(o).join(","));
console.log(JSON.stringify(o));
console.log(Object.values(o).join(","));
for (const [key, value] of Object.entries(o)) {
  console.log(key, "=", value);
}

// Ascending numeric order, not insertion order, within the index section.
const idx = { "9": "nine", "100": "hundred", "2": "two", z: "zed" };
console.log(Object.keys(idx).join(","));
console.log(JSON.stringify(idx));

// Non-indices keep insertion order even when they look numeric: "-1",
// "1.5", "01" (non-canonical), and "4294967295" (2^32-1 is not an index).
const edge = { "01": 1, [-1]: 2, "4294967295": 3, "4294967294": 4 };
console.log(Object.keys(edge).join(","));
