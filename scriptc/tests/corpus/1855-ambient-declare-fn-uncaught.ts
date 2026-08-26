// @exit: 1
// An UNCAUGHT ambient-function reference: the ReferenceError unwinds like
// any uncaught throw — stdout up to the throw matches Node, exit code 1
// (stderr formats are the documented uncaught-report divergence).
declare function missing(flag: boolean): void;

console.log("start");
missing(true);
console.log("unreachable");
