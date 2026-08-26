// for-in loops: fixed record shapes (declaration order, unset-optional
// keys skipped), pure and hybrid index-signature shapes (declared-then-
// overflow, live delete guard), arrays (ascending index STRINGS, snapshot
// bounds pushes, pops skip), the binding forms, labels, and closures.

// Fixed shape: declaration order; string keys.
const point: { x: number; y: number; tag: string } = { x: 1, y: 2, tag: "p" };
for (const k in point) {
  console.log("point key:", k);
}

// Unset optionals never enumerate; set ones do (declared last, so the
// set-late key lands where declaration order puts it).
const opt: { base: number; extra?: string } = { base: 1 };
for (const k in opt) {
  console.log("unset:", k);
}
opt.extra = "here";
for (const k in opt) {
  console.log("set:", k);
}

// The empty object: zero iterations.
for (const k in {}) {
  console.log("never", k);
}

// Pure index signature: insertion order, values readable through the key.
const bag: Record<string, number> = {};
bag["first"] = 10;
bag["second"] = 20;
bag["third"] = 30;
for (const k in bag) {
  console.log("bag:", k, bag[k]);
}

// delete during the walk: a key removed before its turn is skipped, and a
// re-added key is visited (present at visit time) — Node's HasProperty.
const del: Record<string, number> = {};
del["a"] = 1;
del["b"] = 2;
del["c"] = 3;
for (const k in del) {
  if (k === "a") {
    delete del["c"];
  }
  console.log("after delete:", k);
}
const readd: Record<string, number> = {};
readd["p"] = 1;
readd["q"] = 2;
for (const k in readd) {
  if (k === "p") {
    delete readd["q"];
    readd["q"] = 9;
  }
  console.log("readd:", k);
}

// Keys ADDED during the walk are not visited (the snapshot).
const grow: Record<string, number> = {};
grow["seed"] = 0;
for (const k in grow) {
  grow["sprout"] = 1;
  console.log("grow:", k);
}
console.log("grown:", grow["sprout"]);

// Hybrid shape: declared fields first, then overflow keys.
const hybrid: { id: number; [k: string]: number } = { id: 7 };
hybrid["late"] = 8;
hybrid["later"] = 9;
for (const k in hybrid) {
  console.log("hybrid:", k);
}

// Arrays: ascending index strings; typeof is string; pushes during the
// body are NOT visited; pops skip the vanished tail.
const arr = ["a", "b", "c"];
for (const k in arr) {
  console.log("arr:", k, typeof k, arr[parseInt(k, 10)]);
  arr.push("x");
}
console.log("arr length:", arr.length);
const shrink = [1, 2, 3, 4, 5, 6];
for (const k in shrink) {
  console.log("shrink:", k);
  shrink.pop();
  shrink.pop();
}

// var binding: one hoisted slot, holds the last VISITED key after.
for (var vk in point) {
  // spin
}
console.log("var after:", vk!);

// Pre-declared binding target.
let cursor = "";
for (cursor in bag) {
  if (cursor === "second") {
    break;
  }
}
console.log("cursor:", cursor);

// Labeled for-in with labeled continue/break from a nested loop.
let walked = "";
grid: for (const k in { r1: 0, r2: 0, r3: 0 }) {
  for (const j in { c1: 0, c2: 0 }) {
    if (k === "r2" && j === "c2") {
      continue grid;
    }
    if (k === "r3") {
      break grid;
    }
    walked = walked + k + "/" + j + " ";
  }
}
console.log("grid:", walked);

// Fresh const binding per iteration: closures capture their own key.
const grabs: (() => string)[] = [];
for (const k in point) {
  grabs.push(() => k);
}
for (const g of grabs) {
  console.log("grabbed:", g());
}

// for-in inside a function over a parameter shape.
function keyString(o: { alpha: number; beta: number }): string {
  let s = "";
  for (const k in o) {
    s = s + k + ";";
  }
  return s;
}
console.log("fn keys:", keyString({ alpha: 1, beta: 2 }));
