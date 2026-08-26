// The desugared HOFs over record elements: map from records to primitives,
// map from primitives TO records, filter keeping the SAME record references,
// forEach mutating elements in place — every callback/element hand-off is a
// retain/release pair the sanitized lane audits.
interface ModelEntry {
  id: string;
  score: number;
}

const entries: ModelEntry[] = [
  { id: "alpha", score: 3 },
  { id: "beta", score: 7 },
  { id: "gamma", score: 5 },
];

// records -> primitives
const ids = entries.map((e) => e.id);
console.log(ids.join(","));

// primitives -> records
const nums: number[] = [1, 2, 3];
const made = nums.map((n) => ({ id: `m${n}`, score: n * 10 }));
for (const m of made) console.log(m.id, m.score);

// records -> records (fresh shapes)
const scaled = entries.map((e) => ({ id: e.id, score: e.score * 2 }));
console.log(scaled[1].id, scaled[1].score);

// filter keeps the same references
const high = entries.filter((e) => e.score >= 5);
console.log(high.length, high[0] === entries[1], high[1] === entries[2]);

// forEach mutates in place
entries.forEach((e) => {
  e.score = e.score + 1;
});
console.log(entries[0].score, entries[1].score, entries[2].score);

// chained: filter -> map -> join
console.log(
  entries
    .filter((e) => e.score % 2 === 0)
    .map((e) => e.id)
    .join("+"),
);
