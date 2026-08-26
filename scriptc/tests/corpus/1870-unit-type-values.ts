// Unit-only value types: bindings and record fields whose checker type is
// nothing but `null`, `undefined`, or `void` ride the interned
// null|undefined union — the value is always one of the two immortal unit
// instances, comparisons are tag tests, and JSON keeps Node's split (null
// serializes, undefined omits).

// A const null binding (strict mode keeps the literal type).
const a = null;
console.log(a === null);
console.log(a === undefined);

// Annotated unit-only locals: `void` and `typeof undefined` slots hold
// undefined — reads, typeof, and equality all see it.
const w: void = undefined;
console.log(w === undefined);
var v: void;
console.log(typeof v === "undefined");
var u: typeof undefined;
u = undefined;
console.log(u === undefined);

// Uninitialized unit-only `let` at block scope: readable as undefined once
// assigned (tsc's definite-assignment rules gate the read).
let late: undefined;
late = undefined;
console.log(late === undefined);

// Record fields typed null / undefined — the `{ value: null }` spelling and
// the discriminated-union absent-field idiom (`msg?: undefined`).
const o = { p: null, q: "s" };
console.log(JSON.stringify(o));
console.log(o.p === null);
const b: { valid: boolean; msg?: undefined } = { valid: true };
console.log(JSON.stringify(b));
console.log(b.msg === undefined);
const mixed: { foo: null; bar: undefined } = { foo: null, bar: undefined };
console.log(JSON.stringify(mixed));
console.log(mixed.foo === null, mixed.bar === undefined);

// Nested: a unit-only field inside a nested record. (Field names are in
// alphabetical order deliberately: nested-record literals currently
// serialize in canonical shape order — a pre-existing declared-order gap
// outside this fixture's subject.)
const y1 = { a: null, b: { c: null, d: undefined } };
console.log(JSON.stringify(y1));

// A null-returning function: the union-returning signature, called and
// compared like any value.
function giveNull(): null {
  return null;
}
console.log(giveNull() === null);

// File-scope var with a unit-only annotation (the module-global path).
var g1: undefined;
console.log(g1 === undefined);

// The anonymous empty object type `{}`: structurally the empty record.
var e: {} = {};
console.log(JSON.stringify(e));

// export default null — the unit-only module binding.
export default null;
