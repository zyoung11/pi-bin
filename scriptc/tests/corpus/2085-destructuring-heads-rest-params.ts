// for-of EXPRESSION heads (pre-declared bindings) run the destructuring-
// assignment machinery on the element once per pass — identifier, array-
// pattern (defaults included), and object-pattern targets, over arrays
// and Maps (whose pair builds only for the head that needs it) — and
// REST parameters bound to patterns destructure the packed arguments
// array (tuple-typed rests pack positionally at the call site, arity
// pinned by tsc).
let a = 0; let b = 0;
for ([a, b] of [[1, 2], [3, 4]]) console.log(a, b);
let k = "x"; let v = false;
const map = new Map([["", true]]);
for ([k = "dflt", v = false] of map) console.log(JSON.stringify(k), v);
for ([k] of map) console.log("key", JSON.stringify(k));
let mv = false;
for (mv of map.values()) console.log("val", mv);
let o1 = 0;
for ({ q: o1 = 7 } of [{}, { q: 3 }] as { q?: number }[]) console.log("o", o1);
function takeFirstTwoEntries(...[[k1, v1], [k2, v2]]: [string, number][]): void {
  console.log(k1, v1, k2, v2);
}
takeFirstTwoEntries(["a", 1], ["b", 2], ["c", 3]);
function restPattern(...[x, y]: [number, number]): number {
  return x + y;
}
console.log(restPattern(1, 2));
function restWithDefaults(...[rd1 = 5, rd2 = 6]: number[]): number { return rd1 * 10 + rd2; }
console.log(restWithDefaults(), restWithDefaults(1), restWithDefaults(1, 2));
