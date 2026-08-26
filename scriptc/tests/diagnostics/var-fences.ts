// The var fences that remain after lowering shipped: a reference above the
// `var` declaration whose early reads would be `undefined` — a value the
// binding's non-undefined type cannot hold. Fenced, never guessed.
function forwardCapture(): void {
  const read = (): number => n; // captures n before its statement
  console.log(read());
  var n = 5;
  console.log(n);
}
forwardCapture();
