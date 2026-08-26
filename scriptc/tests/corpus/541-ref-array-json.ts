// JSON over the new element kinds, both directions: record arrays and tuple
// arrays stringify Node-exactly (tuples as JSON arrays), and checked casts
// validate parsed text back into typed values — VALID casts only (a valid
// `as` is a no-op under Node, so the differential harness applies; lying
// casts live in tests/harness/dyncheck.test.ts). Record fields alphabetical
// (stringify-parity convention, see 1000-json-stringify-basics.ts).
interface Entry {
  id: string;
  n: number;
  ok: boolean;
}

const entries: Entry[] = [
  { id: "a", n: 1, ok: true },
  { id: "b", n: 2, ok: false },
];
console.log(JSON.stringify(entries));

// tuples serialize as arrays; tuple arrays as arrays of arrays
const pt: [number, number] = [3, 4];
console.log(JSON.stringify(pt));
const kv: [string, number][] = [
  ["one", 1],
  ["two", 2],
];
console.log(JSON.stringify(kv));

// nested: records holding record arrays and tuples
interface Doc {
  entries: Entry[];
  span: [number, number];
  title: string;
}
const doc: Doc = { entries, span: [0, 9], title: "t" };
console.log(JSON.stringify(doc));

// round-trip: parse + checked cast rebuilds typed values
const back = JSON.parse(JSON.stringify(doc)) as unknown as Doc;
console.log(back.title, back.entries.length, back.entries[1].id, back.span[1]);

const kvBack = JSON.parse('[["x",10],["y",20]]') as unknown as [string, number][];
console.log(kvBack.length, kvBack[0][0], kvBack[1][1]);

// heterogeneous tuple positions round-trip with their own types
const mixed = JSON.parse('[["m",true,3.5]]') as unknown as [string, boolean, number][];
console.log(mixed[0][0], mixed[0][1], mixed[0][2]);

// null-armed unions inside record-array elements (alphabetical: hint < name)
interface Slot {
  hint: string | null;
  name: string;
}
const slots: Slot[] = [
  { hint: null, name: "s1" },
  { hint: "use me", name: "s2" },
];
const text = JSON.stringify(slots);
console.log(text);
const slotsBack = JSON.parse(text) as unknown as Slot[];
const secondHint = slotsBack[1].hint;
console.log(slotsBack[0].hint === null, secondHint === null ? "-" : secondHint);

// union-element arrays: distinct record arms discriminated by a shared field
type Shape =
  | { kind: "circle"; r: number }
  | { h: number; kind: "rect"; w: number };
const shapes: Shape[] = [
  { kind: "circle", r: 1 },
  { h: 2, kind: "rect", w: 3 },
];
console.log(JSON.stringify(shapes));
const shapesBack = JSON.parse(JSON.stringify(shapes)) as unknown as Shape[];
let area = 0;
for (const s of shapesBack) {
  if (s.kind === "circle") area += 3 * s.r * s.r;
  else area += s.w * s.h;
}
console.log(area);
