// @transform-types
// (strip-only Node refuses the angle-bracket type assertion below)
// INERT generic values: bindings whose types keep type parameters but whose
// values the program never consumes. Node materializes and drops them —
// zero observable effect — so they compile to NOTHING instead of fencing:
//   - uninitialized, never-read declarations of generic-signature types;
//   - write-only bindings whose writes carry side-effect-free values;
//   - assertion-shaped generic bindings (`< <T>(x: T) => T >(arrow)`),
//     which register like annotated ones and monomorphize per call.

// Uninitialized and never read: `typeof Array` keeps ArrayConstructor's
// type parameters, the object literals keep their own.
var xs2: typeof Array;
var a1: { <T, U extends T>(): void };
var a2: { <T extends U, U extends Date>(): void };

// Write-only: the declaration has no mapping and no reader; the arrow the
// write carries is a value-only expression Node drops with the binding.
var f2: { <T, U>(x: T, y: U): T };
f2 = (x, y) => {
  void y;
  return x;
};

// A type ASSERTION supplies the generic signature exactly like an
// annotation: the checker types the operand's parameters by it, and calls
// monomorphize per pinned signature.
var ident = < <T>(x: T) => T >((x) => x);
console.log(ident(41) + 1, ident("hey").length);

// The angle-bracket cast's `as` twin, uncalled: registered, no instance
// demanded, no code.
const uncalled = ((x) => x) as <T>(x: T) => T;

console.log("done");
