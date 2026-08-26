// `var` hoisting and the undefined window: the binding exists from function
// entry, and reads before the first assignment are `undefined` — honestly
// representable exactly when the type carries an undefined arm, which is
// also the only shape tsc's flow analysis lets read early. Narrower vars
// whose early reads can't be proven away are compile-fenced, never guessed.
function show(v: string | number | undefined): string {
  return v === undefined ? "undefined" : String(v);
}

// Direct reads above the declaration statement (legal: type admits undefined).
function direct(): void {
  console.log(show(v));
  var v: string | undefined;
  console.log(show(v));
  v = "set";
  console.log(show(v));
}
direct();

// A closure created ABOVE the var statement captures the hoisted binding:
// calls before the assignment read undefined, after it the assigned value —
// the same one box throughout.
function forwardCapture(): void {
  const read = (): number | undefined => w;
  console.log(show(read()));
  var w: number | undefined = 5;
  console.log(show(read()));
  w = 6;
  console.log(show(read()));
}
forwardCapture();

// Block-declared, read outside the block after conditional assignment.
function blocks(c: boolean): string {
  if (c) {
    var inner: string | undefined = "assigned";
  }
  return show(inner);
}
console.log(blocks(true), blocks(false));

// An uninitialized var declared mid-function reads undefined both before
// and after its statement until assigned.
function late(): string {
  const before = show(z);
  var z: number | undefined;
  const after = show(z);
  z = 1;
  return before + "/" + after + "/" + show(z);
}
console.log(late());
