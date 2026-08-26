// assert.strictEqual / notStrictEqual over CHECKED-DYNAMIC operands —
// SameValue over the dyn kinds: numbers (NaN, ±0), strings, booleans,
// null/undefined units, node identity for objects/arrays, BOXED-CLOSURE
// identity for functions (one function crossing the unknown boundary
// twice is still one JS function). Generated failure messages are
// assertion_error.js's forms: the short `a !== b` under the 12-char
// budget, the stacked +/- diff with the first-difference `^` indicator
// (Node computes it over the inspected text of EVERY simple stacked
// diff, numbers included), the reference-equal expectation headers for
// composites, and "Values have same structure but are not
// reference-equal:" over the compact:false rendering.
import assert from "node:assert";

function msgOf(fn: () => void): string {
  try {
    fn();
    return "PASS";
  } catch (e) {
    return e instanceof Error ? `${e.name}|${JSON.stringify(e.message)}` : "not an Error";
  }
}

const dnum: unknown = JSON.parse("5");
const dstr: unknown = JSON.parse('"a"');
const dbool: unknown = JSON.parse("true");
const dnull: unknown = JSON.parse("null");
const dobj: unknown = JSON.parse('{"a":1}');
const dobj2: unknown = JSON.parse('{"a":1}');
const dobj3: unknown = JSON.parse('{"b":2}');
const dnan: unknown = 0 / 0;
const dnegz: unknown = -0;

// The passing surface: dyn-vs-scalar, dyn-vs-unit, dyn-vs-dyn.
assert.strictEqual(dnum, 5);
assert.strictEqual(dstr, "a");
assert.strictEqual(dbool, true);
assert.strictEqual(dnull, null);
assert.strictEqual(dnan, 0 / 0); // SameValue: NaN equals NaN
assert.strictEqual(dobj, dobj);
assert.notStrictEqual(dnum, 6);
assert.notStrictEqual(dnegz, 0); // SameValue: -0 differs from +0
assert.notStrictEqual(dobj, dobj2);
assert.notStrictEqual(dnull, undefined);
console.log("strict passes ok");

// Scalar failures: Node's short and stacked forms, byte for byte.
console.log(msgOf(() => assert.strictEqual(dnum, "5")));
console.log(msgOf(() => assert.strictEqual(dstr, 5)));
console.log(msgOf(() => assert.strictEqual(dnull, undefined)));
console.log(msgOf(() => assert.strictEqual(dbool, false)));
console.log(msgOf(() => assert.strictEqual(dnegz, 0)));
console.log(msgOf(() => assert.strictEqual(dnum, 1234568)));
console.log(msgOf(() => assert.strictEqual(JSON.parse("1234567"), 1234568)));
console.log(msgOf(() => assert.strictEqual(JSON.parse('"abcdef"'), "abcdxf")));
console.log(msgOf(() => assert.strictEqual(JSON.parse('"abcdef"'), "abcdef!")));
console.log(msgOf(() => assert.notStrictEqual(dnum, 5)));
console.log(msgOf(() => assert.notStrictEqual(dstr, "a")));
console.log(msgOf(() => assert.notStrictEqual(dnan, 0 / 0)));

// The static stacked-number form carries the same `^` indicator.
console.log(msgOf(() => assert.strictEqual(1234567, 1234568)));

// Composite failures: reference-equality headers over the checked-dynamic tree rendering.
console.log(msgOf(() => assert.strictEqual(dobj, dobj2)));
console.log(msgOf(() => assert.strictEqual(dobj, dobj3)));
console.log(msgOf(() => assert.strictEqual(dobj, 5)));
console.log(msgOf(() => assert.notStrictEqual(dobj, dobj)));

// Custom messages: the equal pair keeps the diff under the replaced
// header; the not pair uses the message alone.
console.log(msgOf(() => assert.strictEqual(dnum, 7, "custom eq")));
console.log(msgOf(() => assert.notStrictEqual(dnum, 5, "custom neq")));

// Functions: the boxed closure is the identity.
const f = (): number => 1;
const uf1: unknown = f;
const uf2: unknown = f;
const g = (): number => 2;
const ug: unknown = g;
assert.strictEqual(uf1, uf2);
assert.strictEqual(uf1, f);
assert.notStrictEqual(uf1, ug);
console.log(uf1 === uf2, uf1 === ug); // dyn === carries the same closure identity
console.log(msgOf(() => assert.strictEqual(uf1, ug)));
console.log(msgOf(() => assert.notStrictEqual(uf1, f)));

// assert(dyn) / assert.ok(dyn): ToBoolean over the dyn kind.
assert(dnum);
assert.ok(dstr);
assert(dobj);
console.log(msgOf(() => assert(JSON.parse("0"))));
console.log(msgOf(() => assert.ok(JSON.parse('""'), "empty!")));
console.log("done");
