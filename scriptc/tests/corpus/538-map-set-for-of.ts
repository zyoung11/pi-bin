// for-of over Maps and Sets: insertion order, destructured and identifier
// heads, and JS's LIVE-iteration semantics under body mutation — entries
// added during iteration are visited, deleted ones are skipped (the
// forEach rules) — plus break/continue/return/throw leaving the loop.
const m = new Map<string, number>();
m.set("a", 1);
m.set("b", 2);
m.set("c", 3);
for (const [k, v] of m) {
  console.log(k, v);
}

// Key-only pattern and identifier head (the [K, V] tuple element).
for (const [k] of m) {
  console.log("key:", k);
}
for (const e of m) {
  console.log("pair:", e[0], e[1]);
}

// Ref values iterate by reference.
const rows = new Map<string, number[]>();
rows.set("evens", [2, 4]);
rows.set("odds", [1, 3, 5]);
for (const [name, arr] of rows) {
  console.log(name, arr.length, arr[0]);
}

// Live mutation: appends are visited, pending deletes are skipped.
const live = new Map<string, number>();
live.set("a", 1);
live.set("b", 2);
for (const [k, v] of live) {
  console.log("live:", k, v);
  if (k === "a") {
    live.set("d", 4); // appended: WILL be visited
    live.delete("b"); // not yet reached: skipped
  }
}
console.log("after:", live.size);

// break and continue bind to the for-of.
let seen = 0;
for (const [k, v] of m) {
  if (k === "a") continue;
  seen = seen + v;
  if (k === "b") break;
}
console.log("seen:", seen);

// return leaves the iteration mid-flight; the map keeps working after.
function findKey(map: Map<string, number>, needle: number): string {
  for (const [k, v] of map) {
    if (v === needle) return k;
  }
  return "?";
}
console.log(findKey(m, 2), findKey(m, 99));
m.set("z", 9);
console.log(findKey(m, 9), m.size);

// a throwing body propagates catchably; iteration state stays sane.
try {
  for (const [k] of m) {
    console.log("t:", k);
    if (k === "b") throw "stop";
  }
} catch {
  console.log("caught");
}
let total = 0;
for (const [, v] of m) total = total + v;
console.log("total:", total);

// nested iteration over the same map.
for (const [ok] of m) {
  for (const [ik] of m) {
    if (ok === ik) console.log("diag:", ok);
  }
}

// Sets: insertion order, duplicates collapsed, live mutation, break.
const s = new Set<string>();
s.add("x");
s.add("y");
s.add("x");
s.add("z");
for (const v of s) {
  console.log("set:", v);
}
const grow = new Set<number>([1, 2]);
for (const v of grow) {
  console.log("grow:", v);
  if (v === 1) {
    grow.add(10); // appended: visited
    grow.delete(2); // pending: skipped
  }
  if (grow.size > 5) break;
}
console.log("grown:", grow.size);
