// RC torture for generics: instantiated bodies churning strings, arrays,
// and records in loops; refcounted values threaded through generic params,
// returns, and generic HOF callbacks. No cycles — the sanitized lane
// (ASan + RC audit) must come out clean.
function id<T>(x: T): T {
  return x;
}

function repeatInto<T>(n: number, make: (i: number) => T): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    out.push(make(i));
  }
  return out;
}

function pick<T>(a: T[], i: number): T {
  return a[i];
}

// Strings created and dropped inside instantiated bodies.
let acc = "";
for (let i = 0; i < 100; i++) {
  acc = id(acc + "x"); // each round: old string dies, new one survives
  const tmp = id(`tmp${i}`); // dies at scope exit
  if (tmp === "never") {
    console.log("impossible");
  }
}
console.log(acc.length);

// Arrays of strings built by a generic HOF, replaced in a loop.
let words: string[] = [];
for (let i = 0; i < 50; i++) {
  words = repeatInto(4, (j) => `w${i}.${j}`); // previous array + strings die
}
console.log(words.length, pick(words, 3));

// Records through generics: allocated per iteration, only the last survives.
type Item = { name: string; vals: number[] };
function tag<T>(x: T, n: number): { it: T; n: number } {
  return { it: x, n };
}
let last = tag<Item>({ name: "seed", vals: [0] }, -1);
for (let i = 0; i < 60; i++) {
  last = tag({ name: `item${i}`, vals: repeatInto(3, (j) => i * 10 + j) }, i);
}
console.log(last.it.name, last.it.vals[2], last.n);

// Generic array churn: nested arrays traded through generic returns.
function dup<T>(a: T[]): T[] {
  const out: T[] = [];
  for (const x of a) {
    out.push(x);
    out.push(x);
  }
  return out;
}
let grid: number[][] = [[1], [2, 3]];
for (let i = 0; i < 30; i++) {
  grid = dup(grid); // shared element references, no cycles
  while (grid.length > 4) {
    grid.pop();
  }
}
console.log(grid.length, grid[0][0]);

// Closure-typed instantiation: closures created/dropped through a generic.
function callIt<T>(f: () => T): T {
  return f();
}
for (let i = 0; i < 40; i++) {
  const s = callIt(() => `c${i}`);
  if (s === "nope") {
    console.log("impossible");
  }
}
console.log("done");
