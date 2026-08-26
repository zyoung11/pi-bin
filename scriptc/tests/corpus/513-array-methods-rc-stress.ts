// RC torture for the array methods: map/filter build fresh arrays whose
// intermediates die immediately (chains), string elements and results churn
// in loops, callbacks capture and mutate. Sanitized lane must be clean.
let keep: string[] = [];
for (let i = 0; i < 50; i++) {
  // Whole chains of temporaries die each round; only the last survives.
  keep = [i, i + 1, i + 2]
    .map((x) => `s${x * 3}`)
    .filter((s) => s.length < 5)
    .map((s) => s + "!");
}
console.log(keep.length, keep[0]);

// join over freshly built string arrays, results discarded and kept.
let total = 0;
for (let i = 0; i < 40; i++) {
  const line = ["a", "b", "c"].map((s) => s + i).join(",");
  total += line.length;
}
console.log(total);

// forEach capturing and rebuilding refcounted state.
let bag: string[] = [];
for (let i = 0; i < 30; i++) {
  ["x", "y"].forEach((s) => {
    bag.push(`${s}${i}`);
  });
  if (bag.length > 10) {
    bag = []; // drop the whole batch
  }
}
console.log(bag.length);

// indexOf/includes on temporaries (receiver and needle both die at
// statement end).
let hits = 0;
for (let i = 0; i < 60; i++) {
  if ([`k${i}`, "fixed"].includes("fixed")) {
    hits += 1;
  }
  hits += ["a", "b"].indexOf("b");
}
console.log(hits);

// Nested arrays through map: element references shared, then dropped.
const grid = [[1, 2], [3, 4], [5]];
for (let i = 0; i < 25; i++) {
  const lens = grid.map((row) => row.length);
  const dup = grid.filter((row) => row.length === 2);
  if (lens[0] + dup.length === 0) {
    console.log("impossible");
  }
}
console.log("done");
