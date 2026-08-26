import { CUBES, LABEL, lookup } from "./tables.ts";

console.log(LABEL, CUBES.length);
let total = 0;
for (let i = 0; i < CUBES.length; i++) {
  total += lookup(i);
}
console.log("total", total, CUBES[3], CUBES.indexOf(729));

// The importer's own comptime island, composed with the imported table at
// runtime (the island itself stays self-contained).
const offsets = comptime(() => {
  const out: number[] = [];
  for (let i = 0; i < 5; i++) {
    out.push(i * 100);
  }
  return out;
});
for (const o of offsets) {
  console.log(o + CUBES[0]);
}
