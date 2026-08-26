// Casting JSON into UNION types: arms are tried in canonical order and the
// first FULL match wins — discriminated unions disambiguate naturally
// because each arm demands its own field names. Valid casts only (see the
// note in 1002-json-parse-cast.ts); JSON keys and record fields
// alphabetical for stringify parity.
//
// Whole-union values can't be narrowed without a discriminant in this
// subset (typeof is rejected), but they CAN be stringified — the union
// serializer dispatches on the runtime tag — which is what makes the
// primitive-union casts observable here.

// Primitive unions: the JSON kind picks the arm; stringify shows which.
type NumOrStr = number | string;
const n = JSON.parse("3.5") as NumOrStr;
const s = JSON.parse('"late"') as NumOrStr;
console.log(JSON.stringify(n), JSON.stringify(s));

// Discriminated record unions from wire data narrow like any other union.
type Shape =
  | { kind: "circle"; r: number }
  | { h: number; kind: "rect"; w: number };
function area(s2: Shape): number {
  if (s2.kind === "circle") {
    return 3 * s2.r * s2.r;
  }
  return s2.h * s2.w;
}
const a = JSON.parse('{"kind":"circle","r":2}') as Shape;
const b = JSON.parse('{"h":3,"kind":"rect","w":4}') as Shape;
console.log(area(a), area(b));
console.log(a.kind, b.kind);

// Union-typed values coming from JSON stringify like their arm.
console.log(JSON.stringify(a), JSON.stringify(b));

// Unions ride function boundaries and reassignment like any union value.
let cur: Shape = JSON.parse('{"kind":"circle","r":1}') as Shape;
console.log(area(cur));
cur = JSON.parse('{"h":2,"kind":"rect","w":2}') as Shape;
console.log(area(cur));

// bool | record: JSON true picks the bool arm, an object the record arm.
type Flag = boolean | { reason: string };
const yes = JSON.parse("true") as Flag;
const why = JSON.parse('{"reason":"blocked"}') as Flag;
console.log(JSON.stringify(yes), JSON.stringify(why));

// number | string[] — an array in the JSON picks the array arm.
type Count = number | string[];
const many = JSON.parse('["x","y"]') as Count;
const one = JSON.parse("4") as Count;
console.log(JSON.stringify(many), JSON.stringify(one));
