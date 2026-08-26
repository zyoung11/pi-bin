// typeof narrowing on `unknown` values: the test is a runtime dyn-kind
// check, the narrowed reads are validated scalar extractions. JSON.parse
// is the unknown factory; an index-signature record's missing key is the
// undefined case.
function describe(v: unknown): string {
  if (typeof v === "string") return `str:${v}:${v.length}`;
  if (typeof v === "number") return `num:${v + 1}`;
  if (typeof v === "boolean") return v ? "bool:yes" : "bool:no";
  if (typeof v === "undefined") return "undef";
  if (v === null) return "null";
  return "other";
}

const raw: unknown = JSON.parse('"hi"');
console.log(describe(raw));
console.log(describe(JSON.parse("42")));
console.log(describe(JSON.parse("true")));
console.log(describe(JSON.parse("false")));
console.log(describe(JSON.parse("null")));
console.log(describe(JSON.parse("[1,2]")));
console.log(describe(JSON.parse('{"a":1}')));

// Negated tests and the test result as a plain value.
const n: unknown = JSON.parse("7");
console.log(typeof n === "number", typeof n !== "string");
const isStr = typeof raw === "string";
console.log(isStr);

// Narrowing inside && chains: the right side reads the narrowed value.
console.log(typeof n === "number" && n > 3);
console.log(typeof n === "string" && n.length > 0);
console.log(typeof raw === "string" && raw.length === 2);

// Unit comparisons on unknown: strict against undefined/null, and the
// loose == null pair covering both.
const rec = JSON.parse('{"s":"x","n":5,"b":true,"z":null}') as { [key: string]: unknown };
console.log(rec["s"] !== undefined, rec["gone"] === undefined);
console.log(rec["z"] == null, rec["z"] === null, rec["s"] != null);
console.log(describe(rec["s"]), describe(rec["n"]), describe(rec["b"]));
console.log(describe(rec["z"]), describe(rec["gone"]));

// typeof "undefined" on a missing key.
const gone = rec["gone"];
console.log(typeof gone === "undefined");

// Narrowed values flow on as their scalar types.
const maybeNum: unknown = JSON.parse("41");
let total = 1;
if (typeof maybeNum === "number") {
  total += maybeNum;
}
console.log(total);
const s2: unknown = JSON.parse('"abc"');
if (typeof s2 === "string") {
  const upper = `${s2}!`;
  console.log(upper, s2.charAt(1));
}
