// arr.entries() as an iterator-helper chain SOURCE: the [index, element]
// pair seeds the fused per-element walk (the values() machinery with the
// pair built per pass), flowing through map/filter/flatMap/take/drop
// into every consuming terminal — the lazy pull order, live length
// re-reads, and take's close-before-delivery all carry over unchanged.
// Stage callbacks destructure the pair or take it whole; counters count
// each stage's own input stream. Node is the oracle byte-for-byte.
const words: string[] = ["alpha", "beta", "gamma", "delta"];

const tagged = words.entries().map(([i, w]) => `${i}:${w}`).toArray();
console.log(tagged.join(" "));

const odds = words.entries().filter(([i]) => i % 2 === 1).map(([, w]) => w).toArray();
console.log(odds.join(","));

words.entries().take(2).forEach(([i, w]) => console.log(i, w));
words.entries().drop(3).forEach(([i, w]) => console.log(i, w));

const total = [3, 4, 5].entries().reduce((acc, [i, n]) => acc + i * n, 0);
console.log(total);

const found = words.entries().find(([, w]) => w.startsWith("g"));
console.log(found === undefined ? "none" : `${found[0]} ${found[1]}`);
console.log(words.entries().some(([i]) => i > 2), words.entries().every(([i]) => i < 4));

// flatMap over pairs, and a whole-pair callback with a stage counter.
const flat = ["a", "b"].entries().flatMap(([i, s]) => [String(i), s]).toArray();
console.log(flat.join("|"));
const counted = words.entries().map((pair, n) => `${n}/${pair[0]}${pair[1]}`).take(3).toArray();
console.log(counted.join(" "));

console.log("done");
