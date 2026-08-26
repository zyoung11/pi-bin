// keys()/values()/entries() drained by an array spread — the lowered
// context (JS drains the iterator on the spot there too). Insertion order,
// overwrite keeps the original position, delete + re-add moves to the end:
// the forEach ordering rules, Node-verified.
const m = new Map<string, number>();
m.set("b", 2);
m.set("a", 1);
m.set("c", 3);
console.log([...m.keys()].join(","));
console.log([...m.values()].join(","));
for (const [k, v] of [...m.entries()]) {
  console.log(k, v);
}

// Overwrite keeps position; delete + re-add moves to the end.
m.set("b", 20);
m.delete("a");
m.set("a", 10);
console.log([...m.keys()].join(","));
console.log([...m.values()].join(","));

// The drained arrays are ordinary arrays: extra elements ride along, and
// the tuples index like any record.
console.log(["start", ...m.keys(), "end"].join("|"));
const es = [...m.entries()];
console.log(es.length, es[0][0], es[0][1]);

// Number keys.
const nums = new Map<number, string>();
nums.set(2, "two");
nums.set(1, "one");
console.log([...nums.keys()].join(","), [...nums.values()].join(","));

// Ref values: summing lengths through a drained values() spread.
const grouped = new Map<string, number[]>();
grouped.set("evens", [2, 4, 6]);
grouped.set("odds", [1, 3]);
const count = [...grouped.values()].reduce((s, arr) => s + arr.length, 0);
console.log("count:", count);

// entries() round-trips through the seeded constructor.
const copy = new Map([...m.entries()]);
copy.set("d", 40);
console.log(copy.size, m.size, copy.get("b") ?? -1);

// An empty map drains to empty arrays.
const empty = new Map<string, string>();
console.log([...empty.keys()].length, [...empty.entries()].length);
