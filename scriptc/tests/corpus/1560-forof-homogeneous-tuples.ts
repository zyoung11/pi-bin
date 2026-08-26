// for-of over HOMOGENEOUS tuples (as-const allowlists): the positions
// iterate in order like the array they spell.
const FILES = ["routes.json", "proxy.pid", "ca.pem", "server.csr"] as const;
const seen: string[] = [];
for (const f of FILES) {
  if (f.endsWith(".pem")) continue;
  seen.push(f.toUpperCase());
}
console.log(seen.join(","));

const NUMS = [1, 2, 3, 5, 8] as const;
let sum = 0;
for (const n of NUMS) {
  if (n > 4) break;
  sum += n;
}
console.log(sum);

// Mutable homogeneous tuples iterate too, and nested loops compose.
const pair: [string, string] = ["x", "y"];
for (const a of pair) {
  for (const b of pair) {
    console.log(a + b);
  }
}

// The loop variable is per-iteration (closures capture distinct values).
let captured: (() => string) | null = null;
for (const f of FILES) {
  if (f === "ca.pem") captured = () => f;
}
console.log(captured !== null ? captured() : "none");
console.log("done");
