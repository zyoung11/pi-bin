// RC churn over index-signature records: repeated construction, overflow
// insert/overwrite/read cycles, records and arrays as overflow values,
// aliasing, and JSON round-trips in a loop. Differentially byte-identical;
// under SCRIPTC_SAN=1 this is the leak/double-free test for the overflow map's
// ownership rules (set moves values in, replaced values release, get
// returns +1, the shape's release tears the map down).

interface Row {
  id: string;
  [key: string]: unknown;
}

let checksum = 0;
for (let i = 0; i < 200; i++) {
  const r: Row = { id: "row" + i };
  r["a"] = "v" + i;
  r["b"] = i;
  r["a"] = "w" + i; // replace releases the old string
  r["nested"] = { id: "inner" + i };
  r["list"] = ["x", "y"];
  const s = JSON.stringify(r);
  checksum += s.length;
  const back = JSON.parse(s) as Row;
  checksum += (back["b"] as number) + (back["a"] as string).length;
  const inner = back["nested"] as { id: string };
  checksum += inner.id.length;
}
console.log("checksum:", checksum);

// Aliased records: the overflow map is shared state, releases balance.
const shared: Record<string, string> = {};
const names: string[] = [];
for (let i = 0; i < 50; i++) {
  const alias = shared;
  alias["k" + i] = "v" + i;
  names[names.length] = "k" + i;
}
let total = 0;
for (const n of names) total += shared[n].length;
console.log("total:", total);

// Records holding index-signature records as declared fields.
interface Entry {
  pricing?: Record<string, string>;
  name: string;
}
const entries: Entry[] = [];
for (let i = 0; i < 50; i++) {
  const pr: Record<string, string> = {};
  pr["input"] = String(i);
  entries[entries.length] = { name: "e" + i, pricing: pr };
}
let sum = 0;
for (const e of entries) {
  if (e.pricing !== undefined) sum += e.pricing["input"].length;
}
console.log("sum:", sum);
