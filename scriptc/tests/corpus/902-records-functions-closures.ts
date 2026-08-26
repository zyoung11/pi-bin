// Records through functions and returns (exact shapes both ways), records
// captured by closures (shared-binding box path), and records holding
// closures that capture records.
interface Vec {
  x: number;
  y: number;
}
function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}
function scale(v: Vec, k: number): Vec {
  return { x: v.x * k, y: v.y * k };
}
const v = add({ x: 1, y: 2 }, scale({ x: 10, y: 20 }, 3));
console.log(v.x, v.y);

// mutation through a parameter is visible to the caller (reference semantics)
function bump(v2: Vec): void {
  v2.x++;
  v2.y += 100;
}
bump(v);
console.log(v.x, v.y);

// a record captured by closures: one shared binding, reassignment included
let state = { count: 0, log: "" };
const inc = (): void => {
  state.count++;
  state.log += "+";
};
const reset = (): void => {
  state = { count: 1000, log: "R" };
};
inc();
inc();
console.log(state.count, state.log);
reset();
inc();
console.log(state.count, state.log);

// closures created in a loop each capture their own record (per-iteration
// `let` binding + a fresh record every pass)
type Cell = { id: number };
let first: () => number = () => -1;
let last: () => number = () => -1;
for (let i = 0; i < 3; i++) {
  const cell: Cell = { id: i * 10 };
  const reader = (): number => cell.id;
  if (i === 0) {
    first = reader;
  }
  last = reader;
}
console.log(first(), last());

// records holding closures that capture records (acyclic: the closure
// captures a DIFFERENT record than the one holding it)
const inner = { hits: 0 };
const kit = {
  tag: "kit",
  hit: (): number => {
    inner.hits++;
    return inner.hits;
  },
};
console.log(kit.hit(), kit.hit(), kit.tag, inner.hits);

// passing func-typed fields around keeps identity
const same = kit.hit === kit.hit;
console.log(same);

// exact shapes across calls: structurally identical alias types interchange
type Pair = { y: number; x: number };
function flip(p: Pair): Vec {
  return { x: p.y, y: p.x };
}
const flipped = flip(v);
console.log(flipped.x, flipped.y);
