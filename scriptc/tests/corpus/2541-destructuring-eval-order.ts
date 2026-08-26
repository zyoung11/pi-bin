// Evaluation order under destructuring, pinned against Node: the RHS
// evaluates ONCE, elements read left to right at their pattern
// positions, defaults evaluate lazily (only on undefined, in element
// order), and rest packs after the named elements consumed.
let log: string[] = [];
function traced<T>(tag: string, value: T): T {
  log.push(tag);
  return value;
}

// The source expression evaluates once, before any element.
function makeSource(): { a: number; b: number } {
  log.push("src");
  return { a: 1, b: 2 };
}
const { a, b } = makeSource();
console.log(a, b, log.join(","));
log = [];

// Defaults evaluate in element order, only when needed, and later
// defaults see earlier bindings.
const partial: { p?: number; q?: number; r?: number } = { q: 5 };
const { p = traced("p", 10), q = traced("q", 20), r = traced("r", p + q) } = partial;
console.log(p, q, r, log.join(","));
log = [];

// Array positions consume left to right; holes skip without reading.
const seq = [traced("e0", 1), traced("e1", 2), traced("e2", 3)];
log = [];
const [, s1, s2 = traced("dflt", -1)] = seq;
console.log(s1, s2, log.join(",") === "" ? "(no default ran)" : log.join(","));
log = [];

// Assignment position: the RHS still evaluates once, then targets
// assign in source order.
let m = 0;
let n = 0;
function pair(): [number, number] {
  log.push("pair");
  return [7, 8];
}
[m, n] = pair();
console.log(m, n, log.join(","));
log = [];

// Getter sources read at each element's own position, left to right.
let tick = 0;
const stream = {
  get pull(): number {
    tick += 1;
    log.push(`pull${tick}`);
    return tick;
  },
  fixed: 100,
};
const { fixed, pull } = stream;
const { pull: pullAgain } = stream;
console.log(fixed, pull, pullAgain, log.join(","));
