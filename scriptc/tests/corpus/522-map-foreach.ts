// Map.forEach: insertion order, (value, key) callback order, and JS's
// LIVE-iteration semantics under callback mutation — entries added during
// iteration are visited, deleted entries are skipped, a delete + re-add
// moves the key to the end, and clear() stops the walk unless the callback
// adds new entries afterwards. All Node-verified behaviors.
const m = new Map<string, number>();
m.set("a", 1);
m.set("b", 2);
m.set("c", 3);
m.forEach((v, k) => console.log(k, v));

// overwrite keeps the original insertion position
m.set("b", 20);
m.forEach((v, k) => console.log("kept:", k, v));

// delete + re-add moves to the end
m.delete("b");
m.set("b", 200);
m.forEach((v, k) => console.log("moved:", k, v));

// mutation during iteration: adds visited, pending deletes skipped
const live = new Map<string, number>();
live.set("a", 1);
live.set("b", 2);
live.forEach((v, k) => {
  console.log("live:", k, v);
  if (k === "a") {
    live.set("d", 4); // appended: WILL be visited
    live.delete("b"); // not yet reached: skipped
  }
});
console.log("after:", live.size);

// deleting the CURRENT entry mid-visit is fine
const self = new Map<string, number>();
self.set("x", 1);
self.set("y", 2);
self.set("z", 3);
self.forEach((v, k) => {
  console.log("self:", k);
  self.delete(k);
});
console.log("emptied:", self.size);

// delete + re-add of an ALREADY-VISITED key: revisited at its new position
const readd = new Map<string, number>();
readd.set("a", 1);
readd.set("b", 2);
readd.forEach((v, k) => {
  console.log("readd:", k, v);
  if (k === "a" && v === 1) {
    readd.delete("a");
    readd.set("a", 9);
  }
});

// clear() stops the iteration; entries added AFTER the clear are visited
const cleared = new Map<string, number>();
cleared.set("p", 1);
cleared.set("q", 2);
cleared.forEach((v, k) => {
  console.log("cleared:", k);
  if (k === "p") {
    cleared.clear();
    cleared.set("r", 3);
  }
});
console.log("post-clear size:", cleared.size);

// heavy growth mid-iteration (forces rehashes): every append is visited
const grow = new Map<number, number>();
grow.set(0, 0);
let added = 0;
let visited = 0;
grow.forEach((v, k) => {
  visited = visited + 1;
  if (added < 50) {
    grow.set(1000 + added, added);
    added = added + 1;
  }
});
console.log("grow visited:", visited, grow.size);

// value-only and zero-parameter callbacks (TS allows fewer params)
let sum = 0;
m.forEach((v) => {
  sum = sum + v;
});
console.log("sum:", sum);
let calls = 0;
m.forEach(() => {
  calls = calls + 1;
});
console.log("calls:", calls);

// a throwing callback propagates catchably; iteration state stays sane
const t = new Map<string, number>();
t.set("one", 1);
t.set("two", 2);
t.set("three", 3);
try {
  t.forEach((v, k) => {
    console.log("t:", k);
    if (v === 2) {
      throw "stop";
    }
  });
} catch {
  console.log("caught");
}
let rest = 0;
t.forEach((v) => {
  rest = rest + v;
});
console.log("rest:", rest);

// nested iteration over the same map (the depth counter nests)
const outer = new Map<string, number>();
outer.set("i", 1);
outer.set("j", 2);
outer.forEach((ov, ok) => {
  outer.forEach((iv, ik) => {
    console.log("pair:", ok, ik, ov + iv);
  });
});
