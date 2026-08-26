// `x == null` / `x != null` — JS's idiomatic null-OR-undefined test on
// unit-armed unions lowers to a tag test (both spellings, either operand
// order), differentially vs Node. Other loose comparisons stay fenced.

function f(n: number): number | undefined {
  return n > 0 ? n : undefined;
}
const a = f(5);
console.log(a == null, a != null, null == a, null != a);
if (a != null) {
  console.log(a + 1); // narrowed to number
}
const b = f(-5);
console.log(b == null, b != null);

let sn: string | null = null;
console.log(sn == null, sn != null, null == sn);
sn = "x";
console.log(sn == null, sn != null);

// Three arms (null AND undefined): the tag-in-set test, every arm.
let t: string | null | undefined = undefined;
console.log(t == null, t != null);
t = null;
console.log(t == null, t != null);
t = "v";
console.log(t == null, t != null);

// Record optional fields on both sides of the operator.
interface Entry {
  id: string;
  note?: string | null;
  released?: number;
}
const e1: Entry = { id: "a" };
const e2: Entry = { id: "b", note: null, released: 7 };
console.log(e1.released == null, e2.released != null);
console.log(e2.note == null, null == e2.note); // null arm IS loose-null
if (e2.released != null) {
  console.log(e2.released * 2);
}

// Parenthesized operands; unit-literal folds.
console.log((e1.released) == null, null != (e2.note));
console.log(null == null, undefined == null, null != undefined);

// A non-nullable operand folds statically (tsc allows the comparison).
const s = "str";
console.log(s == null, s != null);

// In conditions and ternaries.
const label = t == null ? "none" : "some";
console.log(label);
function tally(n: number): number {
  let count = 0;
  for (let i = -n; i <= n; i++) {
    const v = f(i);
    if (v != null) count++;
  }
  return count;
}
console.log(tally(3));
