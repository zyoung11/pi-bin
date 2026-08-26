// Number-keyed Maps use SameValueZero exactly: NaN equals NaN (unlike ===),
// and -0 collapses into +0 — including the STORED key normalizing to +0.
const m = new Map<number, string>();
const nan = 0 / 0;
m.set(nan, "not-a-number");
console.log(m.size, m.has(nan), m.has(0 / 0), m.has(nan * 2));
const viaNan = m.get(0 / 0);
if (viaNan !== undefined) {
  console.log(viaNan);
}

// -0 and +0 are ONE key; setting -0 then reading 0 works both ways.
m.set(-0, "zero");
console.log(m.size, m.has(0), m.has(-0));
m.set(0, "positive"); // overwrites the -0 entry
console.log(m.size);
const z = m.get(-0);
if (z !== undefined) {
  console.log(z);
}
// the stored key normalized to +0 at insertion (spec: set(-0) stores +0)
m.forEach((v, k) => {
  if (v === "positive") {
    console.log("stored zero key prints as:", k, 1 / k > 0);
  }
});

// fractional, negative, and large keys are all distinct doubles
const d = new Map<number, number>();
d.set(0.5, 1);
d.set(-0.5, 2);
d.set(1e100, 3);
d.set(-273.15, 4);
console.log(d.size, d.has(0.5), d.has(-0.5), d.has(1e100), d.has(-273.15));
console.log(d.has(0.25), d.get(2) === undefined);
const half = d.get(0.5);
const negHalf = d.get(-0.5);
if (half !== undefined && negHalf !== undefined) {
  console.log(half + negHalf);
}

// deleting under SameValueZero: delete(0) removes an entry stored via -0
const dz = new Map<number, boolean>();
dz.set(-0, true);
console.log(dz.delete(0), dz.size, dz.delete(0));
dz.set(nan, false);
console.log(dz.delete(0 / 0), dz.size);

// integer churn spread over a range (hashing distributes; all found)
const grid = new Map<number, number>();
for (let i = 0; i < 100; i = i + 1) {
  grid.set(i * 7, i);
}
console.log(grid.size);
let found = 0;
for (let i = 0; i < 100; i = i + 1) {
  if (grid.has(i * 7)) {
    found = found + 1;
  }
}
console.log(found, grid.has(701));
const at21 = grid.get(21);
if (at21 !== undefined) {
  console.log(at21);
}
