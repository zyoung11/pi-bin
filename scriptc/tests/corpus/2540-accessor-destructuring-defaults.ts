// Accessor properties under destructuring: the element's read IS one
// getter call at the element's pattern position, and a DEFAULT applies
// to the getter's result exactly like a data field's (undefined fires
// it, values don't, null never does).
let pulls = 0;
const counter = {
  get next(): number {
    pulls += 1;
    return pulls * 10;
  },
  base: 5,
};
const { next, base } = counter;
console.log(next, base, pulls);
const { next: second } = counter;
console.log(second, pulls);

// Defaults on getter results: undefined fires, a value does not.
let hits = 0;
const sometimes = {
  get maybe(): number | undefined {
    hits += 1;
    return hits > 1 ? hits : undefined;
  },
};
const { maybe: firstPull = -1 } = sometimes;
const { maybe: secondPull = -2 } = sometimes;
console.log(firstPull, secondPull);

// The default expression itself stays lazy: it only evaluates when the
// getter answered undefined.
let defaultRuns = 0;
function fallback(): number {
  defaultRuns += 1;
  return 1000;
}
const supplied = {
  get v(): number | undefined {
    return 42;
  },
};
const { v = fallback() } = supplied;
console.log(v, defaultRuns);

// Class accessors take defaults the same way.
class Lazy {
  seed?: number;
  get grown(): number | undefined {
    return this.seed;
  }
}
const early = new Lazy();
const { grown: g1 = -9 } = early;
early.seed = 8;
const { grown: g2 = -9 } = early;
console.log(g1, g2);
