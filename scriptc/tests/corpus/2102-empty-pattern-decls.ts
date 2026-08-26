// Empty binding patterns in DECLARATIONS over statically non-nullish
// sources: `var {} = e` / `const {} = e` is RequireObjectCoercible and
// nothing else — a pure no-op past the source's own evaluation, for
// records and non-records alike (arrays, numbers boxed by the checker's
// type... anything the static types prove coercible). For-of heads take
// the same rule per element; the empty ARRAY pattern over an array
// source consumes nothing. Sources still evaluate exactly once.
let evals = 0;
function src(): { a: number } { evals++; return { a: 1 }; }
var {} = src();
let {} = src();
const {} = src();
console.log("evals", evals);
// Empty object pattern over a NON-RECORD static source (the trio's
// `for (var {} of ns)` shape — number[][] elements).
const ns: number[][] = [[1], [2, 3]];
var arrs = 0;
for (var {} of ns) arrs++;
for (let {} of ns) arrs++;
for (const {} of ns) arrs++;
console.log("arrs", arrs);
for (var [] of ns) arrs++;
for (const [] of ns) arrs++;
console.log("arrs", arrs);
const nums: number[] = [7, 8, 9];
var {} = nums;
const {} = nums;
console.log("done", evals);
