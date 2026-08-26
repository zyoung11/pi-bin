// Object.fromEntries over [string, V][] values, and the index-signature
// reshape (`as` into a hybrid) behind a real CLI's normalizePricing: entries →
// filter → fromEntries → `as ModelPricing`, with declared-key collisions
// validating at runtime and undeclared keys captured into the overflow.

// The normalizePricing pattern, verbatim shape.
interface ModelPricing {
  input?: string;
  output?: string;
  image?: string;
  [key: string]: unknown;
}
function normalizePricing(pricing?: Record<string, unknown>): ModelPricing | undefined {
  if (!pricing) return undefined;
  const entries = Object.entries(pricing).filter(
    ([, value]) => value != null && value !== ""
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries) as ModelPricing;
}
const raw = JSON.parse(
  '{"input":"1.50","output":"","web_search":"0.01","junk":null,"n":42}'
) as Record<string, unknown>;
const p = normalizePricing(raw);
if (p !== undefined) {
  console.log(p.input ?? "none", p.output ?? "none");
  console.log(p.web_search as string, p.n as number);
  console.log(Object.keys(p).join(","));
  console.log(JSON.stringify(p));
}
console.log(normalizePricing(undefined) === undefined);
console.log(normalizePricing(JSON.parse('{"a":"","b":null}') as Record<string, unknown>) === undefined);

// Plain fromEntries without the reshape: string values, duplicates —
// last value wins, first insertion position holds.
const pairs: [string, string][] = [["a", "1"], ["b", "2"], ["a", "3"]];
const rebuilt = Object.fromEntries(pairs);
console.log(rebuilt["a"], rebuilt["b"], Object.keys(rebuilt).join(","));

// Round-trip: entries → fromEntries reproduces the record (order included).
const src: Record<string, string> = { x: "1" };
src["y"] = "2";
const round = Object.fromEntries(Object.entries(src));
console.log(JSON.stringify(round) === JSON.stringify(src));

// Unknown-valued fromEntries with composite values (deep dyn values ride
// the tuples into the overflow intact).
const mixed: [string, unknown][] = Object.entries(
  JSON.parse('{"list":[1,2],"obj":{"k":"v"},"s":"t"}') as Record<string, unknown>
);
const remade = Object.fromEntries(mixed);
console.log((remade["list"] as number[]).length, (remade["obj"] as { k: string }).k, remade["s"] as string);

// A declared-key collision with the RIGHT runtime type write-throughs to
// the struct slot (the wrong-typed collision throws the catchable
// TypeError — a documented divergence from Node's no-op `as`, exercised
// scriptc-only in the dyncheck harness, not here where Node is the
// oracle).
const okCollision = Object.fromEntries(Object.entries(
  JSON.parse('{"input":"0.5","other":"x"}') as Record<string, unknown>
)) as ModelPricing;
console.log(okCollision.input ?? "none", okCollision.other as string);
