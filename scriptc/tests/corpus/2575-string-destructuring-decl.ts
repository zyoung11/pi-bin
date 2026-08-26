// Destructuring DECLARATIONS from string sources. Array patterns walk
// the STRING ITERATOR — code points, so astral characters stay whole
// (the Array.from(string) machinery) — with holes, defaults (a bounds
// test fires them past the last code point), rest (the remaining code
// points pack fresh), and nested patterns. Object patterns read the
// wrapper's one own data property, `length` — code UNITS, so an astral
// character counts 2 — shorthand, renamed, and (dead-)defaulted.
const s = "a😀c";
const [x, y, z] = s;
console.log(x, y, z);

// Holes skip their position (one code point each, astral included).
const [, mid] = "😀b";
console.log(mid);

// Defaults: dead in range, firing past the end — JS's undefined rule.
const [d1 = "D1", d2 = "D2", d3 = "D3"] = "pq";
console.log(d1, d2, d3);

// A later default may read an earlier binding (left-to-right).
const [h1, h2 = h1 + "!"] = "k";
console.log(h1, h2);

// Rest packs the remaining code points into a fresh string[].
const [head, ...tail] = "x😀yz";
console.log(head, tail.length, tail.join("|"));

// A rest whose operand is itself an array pattern destructures the pack.
const [...[r1, r2]] = "no";
console.log(r1, r2);

// Nested array patterns recurse into single code points.
const [[inner], rest2] = "😀x";
console.log(inner, rest2);

// The wrapper's `length` — UTF-16 code units, so the astral pair is 2.
const { length } = s;
console.log(length);
const { length: renamed } = "😀";
console.log(renamed);
const { length: dflt = 99 } = "ab";
console.log(dflt);

// Nested object patterns over array-pattern elements read the code
// point's own length.
const [{ length: first }] = "😀xy";
console.log(first);

// Parameter patterns ride the same lowerings.
function width({ length: n }: string): number {
  return n;
}
function pair([a, b]: string): string {
  return b + a;
}
console.log(width("😀!"), pair("mn"));

// for-of heads destructure each element string.
for (const [c, ...cs] of ["ab", "😀z"]) {
  console.log(c, cs.join(""));
}
for (const { length: n } of ["", "😀"]) {
  console.log(n);
}

// A for-of DIRECTLY over a string destructures each code point.
for (const [half] of "a😀") {
  console.log(half);
}
for (const { length: units } of "b😀") {
  console.log(units);
}
