// Map-, Set-, and nested-record-valued index signatures: the overflow
// store carries container values with the same type-directed RC and
// trace machinery as user Maps hold.

// Map values (the per-namespace table pattern).
const tables: Record<string, Map<string, number>> = {
  a: new Map([["x", 1]]),
};
tables["b"] = new Map();
tables["b"].set("y", 7);
console.log(tables["a"].get("x"), tables["b"].get("y"), tables["a"].size);
tables["a"].set("x2", 2);
console.log(tables["a"].size, Object.keys(tables).join(","));

// Set values.
const groups: { [k: string]: Set<string> } = { s: new Set(["p"]) };
groups["t"] = new Set();
groups["t"].add("q");
groups["s"].add("p2");
console.log(groups["s"].has("p"), groups["s"].size, groups["t"].size);
console.log(Object.keys(groups).join(","));

// Nested index-signature records; writes reach both levels.
const nested: Record<string, Record<string, number>> = { m: { one: 1 } };
nested["n"] = { two: 2 };
nested["m"]["three"] = 3;
console.log(JSON.stringify(nested));
console.log(Object.keys(nested).join(","), Object.keys(nested["m"]).join(","));

// Reference semantics: the stored container is the same container.
const shared = new Map<string, number>([["k", 5]]);
const holder: Record<string, Map<string, number>> = { first: shared };
shared.set("k2", 6);
console.log(holder["first"].size, holder["first"].get("k2"));

// Containers inside a HYBRID shape (declared field + signature).
type Buckets = { main: Set<number>; [k: string]: Set<number> };
const buckets: Buckets = { main: new Set([1]) };
buckets["spill"] = new Set([2, 3]);
buckets.main.add(4);
console.log(buckets.main.size, buckets["spill"].size);
console.log(Object.keys(buckets).join(","));

// Teardown under churn: replacing a container releases the old one.
const churn: Record<string, Map<string, number>> = {};
for (let i = 0; i < 5; i++) {
  churn["slot"] = new Map([["i", i]]);
}
console.log(churn["slot"].get("i"));
