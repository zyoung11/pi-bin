// Computed property keys that fold at compile time: any PURE expression
// whose checker type is one string or number literal spells the property
// name tsc late-bound — enum members, literal-typed consts, property
// chains, templates of those, and unions whose arms agree on one spelling.
// Number keys take JS's canonical ToString spelling.

// Number enum members: `[E.member]` late-binds "0".
enum E {
  member,
  other,
}
const v = { [E.member]: 10, [E.other]: 20 };
console.log(JSON.stringify(v));

// String enum members through property access.
enum S {
  A = "a",
  B = "b",
}
const s = { [S.A]: "xo", [S.B]: "xe" };
console.log(JSON.stringify(s));
console.log(Object.keys(s).join(","));

// Literal-typed consts — string and number — and negative/fractional
// spellings ("-1" and "1.5" are NOT array indices, so they enumerate in
// insertion order; see 2071 for the order pins).
const k = "marker";
const n = 100;
const obj = { [k]: 1, [n]: 2, [-1]: 3, [1.5]: 4 };
console.log(JSON.stringify(obj));

// Canonical number spelling is JS ToString: 1e21 spells "1e+21".
const big = 1e21;
const exp = { [big]: "big" };
console.log(Object.keys(exp).join(","));

// Property chains over as-const records fold by the member's literal type.
const box = { name: "foo", nested: { id: 7 } } as const;
const chained = { [box.name]: 1, [box.nested.id]: 2 };
console.log(JSON.stringify(chained));

// Templates of literal-typed parts.
const prefix = "pre";
const t = { [`${prefix}-id`]: true, [`${prefix}${n}`]: false };
console.log(JSON.stringify(t));

// A union that collapses to one spelling: E1.x and E2.x are distinct enum
// literal types with the same value, so `E1.x || E2.x` still folds to "0".
enum E1 {
  x,
}
enum E2 {
  x,
}
const u = { [E1.x || E2.x]: 0 };
console.log(JSON.stringify(u));

// Pure operators over foldable operands: the checker types the whole
// expression as one literal.
const cond = { [true ? "yes" : "yes"]: 1 };
console.log(JSON.stringify(cond));

// Mapped-type contexts: the folded name lands on the mapped shape's field.
type TestStrs = { [key in S]: string };
const mapped: TestStrs = { [S.A]: "za", [S.B]: "zb" };
console.log(mapped.a, mapped.b);

// Quoted numeric-string keys were already spelled keys; they share the
// shape with folded number keys.
const quoted = { ["404"]: "not found" };
console.log(JSON.stringify(quoted));
