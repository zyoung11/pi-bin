// Sync generator basics: the body does not start until the first .next(),
// the first .next()'s argument is discarded, exhaustion answers
// { value: undefined, done: true } forever, and a return statement's value
// is the done-value exactly once.
function* g(): Generator<number, number, unknown> {
  console.log("body starts");
  yield 1;
  yield 2;
  return 42;
}
const it = g();
console.log("created");
const a = it.next("discarded");
console.log(a.done === true, a.value as number);
const b = it.next();
console.log(b.done === true, b.value as number);
const c = it.next();
console.log(c.done === true, c.value as number);
const d = it.next();
// NOTE: d.value's CHECKER type here is number (TS's IteratorResult lie —
// the runtime value is undefined after exhaustion); comparisons against
// undefined would fold on the checker's word, so assert done only.
console.log(d.done === true);
// a generator with no yields: the first next completes immediately
function* empty(): Generator<never, number, unknown> {
  return 3;
}
const ie = empty();
const e = ie.next();
console.log(e.done === true, e.value as number);
// narrowed reads flow through done tests
function* two(): Generator<string, void, unknown> {
  yield "x";
  yield "y";
}
const t = two();
let r = t.next();
while (!r.done) {
  console.log(r.value);
  r = t.next();
}
console.log(r.value === undefined);
