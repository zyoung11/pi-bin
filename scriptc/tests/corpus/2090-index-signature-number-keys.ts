// Number-keyed index signatures: the same string-keyed hybrid store as
// `Record<string, T>`, with every access canonicalized through the JS-exact
// number formatter (`m[1]` IS `m["1"]`, `m[1e21]` IS `m["1e+21"]`). Numeric
// literal keys in object literals name their canonical string fields, and
// enumeration (Object.keys / JSON.stringify) answers JS own-key order —
// integer-like keys ascending first, then insertion order.
interface Elem {
  id: string;
}
interface ByIndex {
  [n: number]: Elem;
}
const jq: ByIndex = { 0: { id: "a" }, 1: { id: "b" } };
console.log(jq[0].id, jq[1].id);

const m: { [k: number]: string } = {};
m[2] = "two";
m[1] = "one";
m[1.5] = "frac";
m[-3] = "neg";
m[1e21] = "big";
m[0.0000001] = "exp";
let i = 7;
m[i] = "runtime";
m[i - 0.75] = "computed-frac";
console.log(m[2], m[1.5], m[-3], m[1e21], m[7], m[6.25], m[0.0000001]);
console.log(Object.keys(m).join("|"));
console.log(JSON.stringify(m));

// Dual signatures (string + number) with one interned value type collapse
// into the one store — both key spellings read and write the same entries.
const dual: { [s: string]: number; [n: number]: number } = { one: 1, 2: 22 };
dual[3] = 33;
dual["four"] = 44;
console.log(dual["one"], dual[2], dual[3], dual["four"]);
console.log(JSON.stringify(dual));

// A mapped type over a numeric enum declares the canonical string fields
// ("0".."2") — numeric literal keys hit them directly.
enum E {
  A,
  B,
  C,
}
type Bins = { [K in E]?: string };
const b: Bins = {};
b[1] = "one";
b[0] = "zero";
console.log(JSON.stringify(b), b[0] ?? "u", b[2] ?? "u");
