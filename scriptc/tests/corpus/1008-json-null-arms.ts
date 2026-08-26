// JSON null lands in null union arms: parse casts against null-armed
// targets, stringify of null-holding unions, and narrowing after the cast.

type Rec = { a: string | null; b: number };
const r = JSON.parse('{"a": null, "b": 2}') as Rec;
console.log(r.a === null, r.b);

const r2 = JSON.parse('{"a": "x", "b": 3}') as Rec;
const a2 = r2.a;
if (a2 !== null) {
  console.log(a2, a2.length);
}

// Top-level union targets: null picks the null arm, a string the other.
const v = JSON.parse("null") as string | null;
console.log(v === null);
const w = JSON.parse('"present"') as string | null;
if (w !== null) {
  console.log(w);
}

// number | null arms distinguish the JSON number 0 from JSON null.
const zero = JSON.parse("0") as number | null;
console.log(zero !== null);
const nil = JSON.parse("null") as number | null;
console.log(nil === null);

// Stringify: a null-holding arm serializes as the text null, like Node.
console.log(JSON.stringify(r));
const back: Rec = { a: null, b: 7 };
console.log(JSON.stringify(back));
console.log(JSON.stringify(nil));
console.log(JSON.stringify(zero));

// Nested: null-armed unions inside nested records round-trip.
type Wrap = { inner: { t: string | null } };
const nested = JSON.parse('{"inner": {"t": null}}') as Wrap;
console.log(nested.inner.t === null);
console.log(JSON.stringify(nested));
