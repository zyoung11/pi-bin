// for-of over generators: exhaustion runs finallys, break closes the
// generator (IteratorClose — finallys run, the return value is
// discarded), continue does not close, and generators consume generators
// on nested fibers.
function* nums(): Generator<number, void, unknown> {
  try {
    yield 1;
    yield 2;
    yield 3;
  } finally {
    console.log("closed");
  }
}
for (const x of nums()) console.log("a", x);
for (const x of nums()) {
  console.log("b", x);
  if (x === 2) break;
}
for (const x of nums()) {
  if (x === 1) continue;
  console.log("c", x);
}
// a fresh generator per loop; an exhausted one yields nothing
const done = nums();
for (const x of done) { if (x >= 0) { /* drain */ } }
for (const x of done) console.log("never", x);
// nested: a generator driving another generator
function* inner(): Generator<number, void, unknown> {
  yield 10;
  yield 20;
}
function* outer(): Generator<number, void, unknown> {
  for (const x of inner()) yield x + 1;
}
for (const x of outer()) console.log("nested", x);
// var loop bindings share the hoisted var
for (var v of inner()) { /* last write wins */ }
console.log("var", v!);
// let per-iteration capture
const caps: (() => number)[] = [];
for (const x of inner()) caps.push(() => x);
console.log(caps[0]!(), caps[1]!());
