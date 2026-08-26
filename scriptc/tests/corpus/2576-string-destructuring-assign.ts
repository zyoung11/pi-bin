// Destructuring ASSIGNMENT from string sources — the declaration path's
// rules against EXISTING bindings: array patterns split code points
// (astral characters whole), with elisions, defaults behind the bounds
// test, rest packing the remaining points, and the sole-leading-rest
// unwrap; object patterns read the wrapper's `length` into identifier,
// property, and element targets. Empty patterns are pure validation.
let a = "";
let b = "";
let rest: string[] = [];
[a, b] = "😀x";
console.log(a, b);

// Defaults fire exactly past the last code point.
[a = "A", b = "B"] = "z";
console.log(a, b);

// Elision consumes a position without assigning.
[, b] = "pq";
console.log(b);

[a, ...rest] = "p😀r";
console.log(a, rest.join(","));

// `[...[x, y]] = s` consumes what the inner pattern alone would.
[...[a, b]] = "uv";
console.log(a, b);

// The assignment expression's VALUE is the source string itself.
console.log(([a] = "w"));

let n = 0;
({ length: n } = "hello");
console.log(n);
({ length: n = 42 } = "😀"); // dead default: length always exists
console.log(n);

// Property and element targets ride the shared target plumbing.
const box = { v: 0 };
({ length: box.v } = "abc");
console.log(box.v);
const cells = [0, 0];
({ length: cells[1] } = "😀😀");
console.log(cells.join(","));

// Empty patterns: GetIterator / RequireObjectCoercible, nothing bound.
[] = "xy";
({} = "xy");

// for-of expression heads assign per element.
for ([a, b = "!"] of ["mn", "😀"]) {
  console.log(a, b);
}
for ({ length: n } of ["", "abc"]) {
  console.log(n);
}

// A for-of DIRECTLY over a string assigns per code point.
for ([a] of "c😀") {
  console.log(a);
}
for ({ length: n } of "d😀") {
  console.log(n);
}
