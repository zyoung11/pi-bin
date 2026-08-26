// Array.from({ length: n }, mapfn) — the counted-generation idiom. The
// mapper receives (undefined, i) exactly like Node; fractional lengths
// truncate and negative lengths produce an empty array (ToLength).
console.log(Array.from({ length: 3 }, (_, i) => i * 2).join(","));
console.log(Array.from({ length: 4 }, (_, i) => `#${i + 1}`).join(" "));

// Zero-parameter and one-parameter mappers (prefix arity, ordinary TS).
console.log(Array.from({ length: 3 }, () => "x").join(""));
let calls = 0;
const counted = Array.from({ length: 5 }, () => {
  calls = calls + 1;
  return calls;
});
console.log(counted.join(","), calls);

// The first mapper argument IS undefined, like Node's.
console.log(
  Array.from({ length: 2 }, (v, i) => (typeof v === "undefined" ? i : -1)).join(",")
);

// Edge lengths: zero, negative, fractional.
console.log(Array.from({ length: 0 }, (_, i) => i).length);
console.log(Array.from({ length: -3 }, (_, i) => i).length);
console.log(Array.from({ length: 2.9 }, (_, i) => i).join(","));

// The length is any number expression; shorthand `{ length }` counts.
const per = 2;
const models = ["m1", "m2"];
let jobIndex = 0;
const jobs = models.flatMap((modelId) =>
  Array.from({ length: per }, (_, i) => {
    jobIndex = jobIndex + 1;
    return {
      modelId,
      label: `${modelId} #${i + 1}`,
      index: jobIndex - 1,
    };
  })
);
for (const j of jobs) {
  console.log(j.index, j.label);
}
const length = 3;
console.log(Array.from({ length }, (_, i) => i + 1).join(","));

// Record results and further chaining.
const squares = Array.from({ length: 4 }, (_, i) => i * i);
console.log(squares.filter((n) => n > 1).join(","));
