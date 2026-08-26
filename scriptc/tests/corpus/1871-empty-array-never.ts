// The empty array literal and `never`: `[]` with no contextual type infers
// never[], whose element type is uninhabited — the representation is
// unobservable, so the array maps (f64 elements) and every use is the
// empty-array behavior Node has.

// for-of over a literal []: zero iterations, loop var typed never.
for (const x of []) {
  console.log(x);
}
console.log("after-empty-loop");

// An empty literal bound and read: length, includes-style emptiness.
const none = [] as never[];
console.log(none.length);

// An empty literal against a union slot still builds the ARM's element
// type (the contextual-union rule), not the never representation.
const s: string[] | undefined = [];
console.log(JSON.stringify(s));

// Sparse literals: holes materialize the undefined arm — length and index
// reads answer exactly Node. (Node's iteration methods SKIP holes; scriptc
// visits the positions — the documented sparse divergence — so this
// fixture pins only length/index/JSON-free surfaces.)
var v1 = [,];
console.log(v1.length);
console.log(v1[0] === undefined);
var v2 = [, ,];
console.log(v2.length);

// An explicit undefined[] annotation with spelled-out elements.
const us: undefined[] = [undefined, undefined];
console.log(us.length, us[1] === undefined);
