// String(unknown) and dyn-vs-scalar strict equality: Node's String() over
// every dyn kind (arrays join, objects print "[object Object]"), and
// ===/!== between an `unknown` value and a number/string/boolean — a kind
// test plus payload compare, strict-equality-exact (no coercions, NaN
// unequal to itself).

const vals = JSON.parse(
  '{"u":null,"b":true,"n":42.5,"z":-0,"s":"txt","a":[1,"x",null,[2,3]],"o":{"k":1},"e":[]}'
) as Record<string, unknown>;
const r: Record<string, unknown> = {};
r.un = undefined;

// String() over each kind.
console.log(String(r.un), String(vals.u), String(vals.b), String(vals.n), String(vals.z));
console.log(String(vals.s), String(vals.a), String(vals.o), String(vals.e));
console.log(`t:${vals.n} ${vals.a} ${vals.o}`);

// Number edge cases: Infinity/NaN spell out (String, not JSON).
const edge: Record<string, unknown> = {};
edge.inf = 1 / 0;
edge.ninf = -1 / 0;
edge.nan = 0 / 0;
edge.big = -1e21;
console.log(String(edge.inf), String(edge.ninf), String(edge.nan), String(edge.big));

// dyn vs scalar strict equality, both operand orders, both operators.
const n = vals.n;
console.log(n === 42.5, n !== 42.5, n === 42, 42.5 === n);
console.log(vals.s === "txt", vals.s !== "txt", vals.s === "other", "txt" === vals.s);
console.log(vals.b === true, vals.b === false, false !== vals.b);
// Cross-kind strict equality is false, never a coercion.
console.log(vals.s === 0, vals.n === "42.5", vals.b === 1, vals.u === false);
// NaN compares unequal to everything, itself included.
console.log(edge.nan === (0 / 0), edge.nan !== (0 / 0));
// -0 === 0, like JS.
console.log(vals.z === 0, vals.z !== 0);
// Composites never equal scalars.
console.log(vals.a === "1,x,,2,3", vals.o === 0, vals.e === "");

// The filter idiom over unknown values (predicate mixes nullish + scalar
// strict equality).
const entries: [string, unknown][] = Object.entries(vals);
const nonEmpty = entries.filter(([, v]) => v != null && v !== "" && v !== false);
console.log(nonEmpty.length);

// Tuples with dyn fields as plain values: reads, writes, JSON.
const t: [string, unknown] = ["k", vals.o];
console.log(t[0], (t[1] as { k: number }).k);
const list: [string, unknown][] = [["a", 1], ["b", "two"], ["c", undefined]];
console.log(list.length, String(list[1][1]), list[2][1] === undefined);
