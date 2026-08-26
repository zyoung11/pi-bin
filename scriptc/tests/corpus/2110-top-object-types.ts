// The top object types: `{}`, the lib's `Object`, `object` (NonPrimitive),
// and a user's empty interface all admit every non-nullish value in tsc's
// assignability, so they lower like `unknown` (the dyn) instead of an
// exact empty record — assignments convert at the site, reads narrow back
// out through the same typeof/checked-cast machinery unknown uses. The type
// INFERRED from an empty object literal stays the empty record (it
// describes a built value, not an admit-everything annotation).

// `{}` slots take primitives, records, and arrays.
const a: {} = 1;
const b: {} = "s";
const c: {} = { x: 1 };
const d: {} = [1, 2, 3];
console.log(typeof a, typeof b, typeof c, typeof d);

// The lib's `Object` is the same top type.
const eo: Object = true;
const fo: Object = "text";
const go: Object = { y: "z" };
console.log(typeof eo, typeof fo, typeof go);

// `object` admits the non-primitives.
const h: object = { n: 5 };
const i: object = ["a"];
console.log(typeof h, typeof i);

// A user's EMPTY interface is structurally the same admit-everything type.
interface Empty {}
const j: Empty = 42;
const k: Empty = { deep: { ok: true } };
console.log(typeof j, typeof k);

// typeof narrowing reads the value back out, exactly the unknown story.
function describe(v: {}): string {
  if (typeof v === "number") return `num:${v + 1}`;
  if (typeof v === "string") return `str:${v.length}`;
  return typeof v;
}
console.log(describe(7), describe("abc"), describe({ p: 1 }));

// Parameters and returns carry the same lowering across call boundaries.
function idTop(v: Object): Object {
  return v;
}
console.log(typeof idTop("through"), typeof idTop(99));

// The empty object literal still flows into a `{}` slot (record → dyn).
const empty: {} = {};
console.log(JSON.stringify(empty));

// An inferred empty literal binding stays a record and stringifies as one.
const built = {};
console.log(JSON.stringify(built));
