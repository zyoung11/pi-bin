// yield* delegation (statement position): the delegate drains through the
// outer generator, consumer .next(v) arguments forward INTO the delegate,
// and completion hands control back to the outer body.
function* inner(): Generator<string, string, unknown> {
  const s = yield "i1";
  console.log("inner got", s as string);
  return "IR";
}
function* outer(): Generator<string, void, unknown> {
  yield* inner();
  yield "o2";
}
const io = outer();
console.log(io.next().value as string);
console.log(io.next("SENT").value as string);
console.log(io.next().done === true);

// chained delegation
function* a(): Generator<number, void, unknown> {
  yield 1;
  yield 2;
}
function* b(): Generator<number, void, unknown> {
  yield 0;
  yield* a();
  yield 3;
}
function* c(): Generator<number, void, unknown> {
  yield* b();
  yield 4;
}
for (const x of c()) console.log(x);

// delegation into an exhausted generator is a no-op pass-through
function* empty(): Generator<number, void, unknown> {
  if (false) yield 0;
}
function* wrap(): Generator<number, void, unknown> {
  yield* empty();
  yield 9;
}
for (const x of wrap()) console.log("w", x);
