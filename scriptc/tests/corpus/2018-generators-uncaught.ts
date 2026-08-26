// @exit: 1
// An uncaught body exception propagates out of the resume — through the
// for-of desugar and up to the top level, exit 1 like Node.
function* bad(): Generator<number, void, unknown> {
  yield 1;
  yield 2;
  throw new Error("mid-drain");
}
for (const x of bad()) console.log(x);
console.log("unreachable");
