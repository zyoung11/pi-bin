// A DECLARED-fields record flowing into a pure index-signature shape
// (`Record<string, T>`): every field enters the value slot and the record
// becomes pure overflow storage — keys in declaration order, which is
// Node's insertion order for literals written in order (SEMANTICS.md 36/37).
const src = { b: 2, a: 1, c: 3 };
const rec: Record<string, number> = src;
console.log(Object.keys(rec).join(","));
console.log(JSON.stringify(rec));
let total = 0;
for (const k of Object.keys(rec)) total += rec[k]!;
console.log(total);

// Fields may WRAP into a union-valued slot.
const mixed = { count: 4, label: "x" };
const wide: Record<string, number | string> = mixed;
const parts: string[] = [];
for (const k of Object.keys(wide)) {
  const v = wide[k];
  parts.push(typeof v === "number" ? `${k}=${v}` : `${k}:${v}`);
}
console.log(parts.join(","));

// A pure index shape widening into a wider-valued pure index shape
// (per-value re-tag through the same capture).
const nums: Record<string, number> = { one: 1, two: 2 };
const loose: Record<string, number | string> = nums;
const seen: string[] = [];
for (const k of Object.keys(loose)) {
  const v = loose[k];
  if (typeof v === "number") seen.push(`${k}!${v}`);
}
console.log(seen.join(","));

// Call-argument and return flows.
function countKeys(m: Record<string, number>): number {
  return Object.keys(m).length;
}
console.log(countKeys({ x: 1, y: 2, z: 3 }));
function asTable(): Record<string, string> {
  const pair = { lo: "a", hi: "b" };
  return pair;
}
console.log(JSON.stringify(asTable()));

// Reads through the captured record answer per key.
console.log(rec["a"], rec["c"]);
