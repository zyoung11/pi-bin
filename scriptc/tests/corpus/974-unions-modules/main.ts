// Unions across module boundaries: imported union-returning functions,
// union values passed back into the exporter, live-binding union globals,
// and importer-side narrowing of exporter-made values.
import type { Outcome } from "./result.ts";
import { attempt, describe, last, record } from "./result.ts";

console.log("main sees", describe(last));

for (let i = 1; i < 5; i = i + 1) {
  const o = attempt(i);
  if (o.tag === "hit") {
    console.log(i, "hit", o.score);
  } else {
    console.log(i, o.reason);
  }
}

// The exporter mutates its own global; the import observes it live.
record(2);
console.log("after record(2):", describe(last));
record(9);
if (last.tag === "miss") {
  console.log("after record(9):", last.reason);
}

// Locally constructed values of the imported union type flow back in.
const mine: Outcome = { tag: "hit", score: -0 };
console.log(describe(mine), 1 / (mine.tag === "hit" ? mine.score : 1));
