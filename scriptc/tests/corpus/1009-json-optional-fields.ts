// JSON and optional record fields, differentially vs Node:
// - JSON.stringify DROPS a field holding undefined (Node's exact rule),
//   including mid-object (comma placement) and when everything drops;
// - a checked cast accepts a MISSING key for an optional field (the read
//   compares === undefined), a PRESENT key validates as usual, and JSON
//   null matches the null arm of an optional `string | null` field;
// - round-trips: parse -> mutate -> stringify.
interface Cfg {
  host: string;
  port?: number;
  note?: string | null;
}

// stringify: drop at the end, in the middle, everywhere
const a: Cfg = { host: "h1" };
const b: Cfg = { host: "h2", port: 8080 };
const c: Cfg = { host: "h3", port: undefined, note: null };
console.log(JSON.stringify(a));
console.log(JSON.stringify(b));
console.log(JSON.stringify(c));

type AllOpt = { x?: number; y?: string };
const nothing: AllOpt = {};
const some: AllOpt = { y: "only" };
console.log(JSON.stringify(nothing));
console.log(JSON.stringify(some));

// parse casts: missing key -> undefined arm; present keys validate
const p1 = JSON.parse('{"host":"x"}') as Cfg;
console.log(p1.host, p1.port === undefined, p1.note === undefined);
const p2 = JSON.parse('{"host":"y","port":3,"note":"hello"}') as Cfg;
console.log(p2.host, p2.port !== undefined);
if (p2.port !== undefined) {
  console.log(p2.port * 2);
}
// the 3-arm optional field (string | null | undefined): each arm via tag
// tests (single !==/=== comparisons stay within supported narrowing)
const p3 = JSON.parse('{"host":"z","note":null}') as Cfg;
console.log(p3.note === null, p3.note === undefined);
console.log(p2.note !== null, p2.note !== undefined);

// width tolerance still holds alongside optional fields: extra keys are
// ignored (re-stringifying such a value would DROP them — the documented
// width-tolerance divergence — so only the declared fields are read here)
const p4 = JSON.parse('{"host":"w","extra":true,"port":9}') as Cfg;
console.log(p4.host, p4.port !== undefined, p4.note === undefined);

// round-trip: parse -> mutate both directions -> stringify
p2.port = undefined;
p1.port = 99;
p3.note = "written";
console.log(JSON.stringify(p1));
console.log(JSON.stringify(p2));
console.log(JSON.stringify(p3));

// nested: optional fields inside records inside arrays... records nest,
// arrays of records don't exist yet — nest through a record field instead
type Outer = { inner: Cfg; seq: number };
const o = JSON.parse('{"inner":{"host":"deep"},"seq":1}') as Outer;
console.log(o.seq, o.inner.host, o.inner.port === undefined);
console.log(JSON.stringify(o));
o.inner.port = 443;
console.log(JSON.stringify(o));
