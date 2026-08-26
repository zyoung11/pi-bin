// RC stress for the union re-tag helpers: heap payloads (strings, records,
// arrays) crossing union→union re-tags in bulk. The ASan + RC-audit lane
// turns this into a leak / use-after-free test — every re-tag narrows the
// payload out (+1) and moves it into the fresh destination box.

type Pair = { a: string; b: number[] };

function widenStr(x: string | undefined): number | string | undefined {
  return x;
}
function widenPair(x: Pair | undefined): Pair | null | undefined {
  return x;
}

let strHits = 0;
let undefHits = 0;
for (let i = 0; i < 20000; i = i + 1) {
  const s = i % 3 === 0 ? undefined : `payload-${i}`;
  const w = widenStr(s);
  if (w === undefined) {
    undefHits = undefHits + 1;
  } else {
    strHits = strHits + 1;
  }
}
console.log(strHits, undefHits);

let total = 0;
for (let i = 0; i < 5000; i = i + 1) {
  const p: Pair | undefined = i % 4 === 0 ? undefined : { a: `k${i}`, b: [i, i + 1] };
  const w = widenPair(p);
  if (w !== undefined && w !== null) {
    total = total + w.b.length;
  }
}
console.log(total);

// Re-tag the SAME box repeatedly: the source box is borrowed each time and
// must survive every pass; each destination box frees independently. (The
// maker keeps tsc from narrowing `keep` to Pair at the use sites — the
// calls below must see the wide union and re-tag.)
function mkPair(i: number): Pair | undefined {
  return i >= 0 ? { a: "stable", b: [9] } : undefined;
}
const keep = mkPair(1);
let sum = 0;
for (let i = 0; i < 10000; i = i + 1) {
  const w = widenPair(keep);
  if (w !== undefined && w !== null) {
    sum = sum + w.b[0]!;
  }
}
console.log(sum);
if (keep !== undefined) {
  console.log(keep.a);
}
