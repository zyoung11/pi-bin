// RC stress for optional record fields: loops that create and drop records
// with optional string fields, flip fields between the value arm and
// undefined, and shuffle records (and their absent fields) through arrays of
// numbers derived from them. Under SCRIPTC_SAN=1 this is a leak/double-free test
// for the interned immortal undefined instances and the wrapped value arms.
type Entry = { key: string; note?: string; hits?: number };

function churn(n: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) {
    const e: Entry = i % 3 === 0 ? { key: "k" + i } : { key: "k" + i, note: "n" + i, hits: i };
    if (e.note !== undefined) {
      total += e.note.length;
    }
    if (e.hits !== undefined) {
      total += e.hits;
    }
    // flip the arms back and forth; old payloads must release exactly once
    e.note = "swapped-" + i;
    e.note = undefined;
    e.note = "swapped-again-" + i;
    e.hits = undefined;
    if (e.note !== undefined) {
      total += e.note.length;
    }
  }
  return total;
}
console.log(churn(500));

// records with optional fields captured and rebuilt inside closures
function counterFactory(seed: string): () => number {
  let cell: Entry = { key: seed };
  let n = 0;
  return () => {
    n++;
    cell = n % 2 === 0 ? { key: seed, note: seed + n } : { key: seed + n };
    return cell.note === undefined ? n : n + cell.note.length;
  };
}
const tick = counterFactory("s");
let acc = 0;
for (let i = 0; i < 200; i++) {
  acc += tick();
}
console.log(acc);

// last-one-out: a module-level record ends holding undefined arms at exit
const tail: Entry = { key: "tail", note: "kept" };
tail.note = undefined;
console.log(tail.key, tail.note === undefined);
