// Generators interacting with the loop surface: labeled breaks crossing
// the for-of desugar (the label rides the desugared while), yields inside
// loops/switch, and a generator driven by two interleaved consumers.
function* pairs(): Generator<number, void, unknown> {
  for (let i = 0; i < 3; i++) {
    yield i * 2;
    yield i * 2 + 1;
  }
}
outer: for (const x of pairs()) {
  for (const y of pairs()) {
    if (y === 2 && x === 2) continue outer;
    if (x === 4) break outer;
    if (y > 1) break;
    console.log(x, y);
  }
}
function* fromSwitch(mode: number): Generator<string, void, unknown> {
  switch (mode) {
    case 0:
      yield "zero";
      break;
    case 1:
      yield "one";
      yield "one+";
      break;
    default:
      yield "other";
  }
  yield "tail";
}
for (const s of fromSwitch(0)) console.log(s);
for (const s of fromSwitch(1)) console.log(s);
for (const s of fromSwitch(9)) console.log(s);
// two live generators interleaved
function* count(tag: string): Generator<string, void, unknown> {
  for (let i = 0; i < 3; i++) yield tag + i;
}
const g1 = count("a");
const g2 = count("b");
let r1 = g1.next();
let r2 = g2.next();
while (!r1.done || !r2.done) {
  if (!r1.done) {
    console.log(r1.value);
    r1 = g1.next();
  }
  if (!r2.done) {
    console.log(r2.value);
    r2 = g2.next();
  }
}
console.log("end");
