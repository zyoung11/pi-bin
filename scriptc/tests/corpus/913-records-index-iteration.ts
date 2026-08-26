// Object.keys/values/entries over INDEX-SIGNATURE (overflow-carrying)
// record shapes: pure Record<string, T> shapes iterate in Node's exact
// own-key order — canonical array indices ascending first, then insertion
// order — and hybrids list declared fields (declaration order, unset
// optionals skipped) before the overflow. Values surface as the checker's
// element type (dyn included: `[string, unknown]` tuples with dyn fields).

// Pure string-valued shape, integer-like keys mixed in: Node's order.
const bag: Record<string, string> = { alpha: "a" };
bag["beta"] = "b";
bag["10"] = "ten";
bag["2"] = "two";
bag.gamma = "g";
console.log(Object.keys(bag).join(","));
console.log(Object.values(bag).join(","));
for (const [k, v] of Object.entries(bag)) console.log(k, "=", v);

// Empty and guard patterns.
const empty: Record<string, string> = {};
console.log(Object.keys(empty).length, Object.keys(bag).length > 0);

// Number-valued shapes.
const counts: Record<string, number> = {};
counts.x = 1;
counts["y"] = 2;
let total = 0;
for (const n of Object.values(counts)) total += n;
console.log(total, Object.entries(counts).length);

// `unknown`-valued: the tuples carry dyn fields; filter/length/for-of over
// them, with dyn nullish tests and dyn-vs-scalar strict equality in the
// predicate (the normalizePricing filter shape).
const pricing: Record<string, unknown> = JSON.parse(
  '{"input":"1.5","output":"","image":null,"web":42,"deep":{"k":true}}'
) as Record<string, unknown>;
const kept = pricing ? Object.entries(pricing).filter(([, value]) => value != null && value !== "") : [];
console.log(kept.length);
for (const [k, v] of kept) console.log(k, String(v));

// Hybrid (declared + overflow), arranged so declared-then-overflow
// coincides with Node's insertion order; an unset optional is skipped on
// both sides (the unset-optional convention matches Node's missing key).
interface Pricing {
  input?: string;
  output?: string;
  [key: string]: unknown;
}
const p: Pricing = { input: "1.50" };
p.web_search = "0.01";
p.n = 7;
console.log(Object.keys(p).join(","));
for (const [k, v] of Object.entries(p)) console.log(k, String(v));

// Overwrites keep the first insertion position; deletes are not a surface
// (no `delete` lowering) — last-write-wins on the value.
bag["beta"] = "b2";
console.log(Object.entries(bag).map(([k, v]) => `${k}:${v}`).join(" "));

// entries → new Map (the response-id normalization pattern, sans locale).
const hdrs: Record<string, string> = { "x-request-id": "  abc  " };
const normalized = new Map(Object.entries(hdrs).map(([key, value]) => [key, value] as [string, string]));
const hit = normalized.get("x-request-id")?.trim();
console.log(hit ?? "none", normalized.size);

// Aliasing: iteration observes writes through any alias.
const alias = counts;
alias.z = 40;
console.log(Object.keys(counts).join(","), Object.values(counts).length);
