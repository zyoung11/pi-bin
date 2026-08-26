// Number statics: the predicate quartet (static C, no coercion by
// construction) and the finite constants baked as literals — all compared
// byte-for-byte against Node.
console.log(Number.isFinite(1), Number.isFinite(0.5), Number.isFinite(0 / 0));
console.log(Number.isFinite(1 / 0), Number.isFinite(-1 / 0), Number.isFinite(-0));
console.log(Number.isNaN(0 / 0), Number.isNaN(1), Number.isNaN(1 / 0));
console.log(Number.isInteger(3), Number.isInteger(3.5), Number.isInteger(-0));
console.log(Number.isInteger(0 / 0), Number.isInteger(1 / 0), Number.isInteger(1e308));
console.log(Number.isSafeInteger(9007199254740991), Number.isSafeInteger(9007199254740992));
console.log(Number.isSafeInteger(-9007199254740991), Number.isSafeInteger(3.5));

// Arguments are ordinary expressions — evaluated once, side effects kept.
let calls = 0;
function next(): number {
  calls++;
  return calls === 1 ? 42 : 0 / 0;
}
console.log(Number.isInteger(next()), Number.isNaN(next()), calls);

// The finite constants, printed through the JS-exact number formatter.
console.log(Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
console.log(Number.EPSILON, Number.MAX_VALUE, Number.MIN_VALUE);
console.log(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2);
console.log(1 + Number.EPSILON > 1, 0 < Number.MIN_VALUE);
