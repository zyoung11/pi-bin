/* Indexes an array without a guard. Under this project's own tsconfig
 * (strict, but noUncheckedIndexedAccess OFF — TypeScript's default) this
 * typechecks and compiles; the sibling indexed-strict fixture compiles the
 * SAME program under a tsconfig that turns the knob on and must fail
 * preflight — pinning that scriptc adopts the project's strictness in
 * both directions. */
const xs = [10, 20, 30];
const i = 1;
const picked = xs[i];
console.log(picked + 1);
