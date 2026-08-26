// RC stress for unions: wrap/narrow churn in loops over string and record
// payloads, unions replaced inside records and boxes, per-iteration loop
// bindings captured by closures. The SCRIPTC_SAN lane runs this under ASan +
// the runtime RC audit (unions counted).
type Cell = { kind: "word"; text: string } | { kind: "count"; n: number };

function word(text: string): Cell {
  return { kind: "word", text };
}
function count(n: number): Cell {
  return { kind: "count", n };
}
function read(c: Cell): string {
  if (c.kind === "word") {
    return c.text;
  }
  return `${c.n}`;
}

// Tight wrap/narrow churn: every iteration allocates a union, a payload
// string, narrows, concatenates, and drops everything.
let acc = "";
for (let i = 0; i < 50; i = i + 1) {
  const c = i % 3 === 0 ? word(`w${i}`) : count(i * i);
  acc = acc + read(c) + ",";
  const again: Cell = c; // aliasing an existing union retains, not rewraps
  if (again.kind === "word") {
    acc = acc + again.text.length;
  }
}
console.log(acc.length, acc.slice(0, 24));

// Unions replaced inside a record field, in a loop (old value released).
const holder: { cur: Cell } = { cur: word("start") };
for (let i = 0; i < 40; i = i + 1) {
  holder.cur = i % 2 === 0 ? count(i) : word(`repl-${i}`);
}
console.log(read(holder.cur));

// Captured (boxed) union churned through a closure.
function makeSwapper(): (c: Cell) => string {
  let held: Cell = word("empty");
  return (c: Cell): string => {
    const prev = read(held);
    held = c;
    return prev;
  };
}
const swap = makeSwapper();
let trail = "";
for (let i = 0; i < 30; i = i + 1) {
  trail = swap(i % 2 === 0 ? word(`s${i}`) : count(i));
}
console.log("last displaced:", trail);

// Per-iteration `for (let ...)` binding holding a union, captured by
// closures made in different iterations (fresh box per iteration).
let readers: () => string = () => "none";
let readersEarly: () => string = () => "none";
let iter = 0;
for (let c: Cell = word("first"); iter < 3; iter = iter + 1) {
  if (iter === 0) {
    readersEarly = () => read(c);
  }
  readers = () => read(c);
  c = count(iter * 100);
}
console.log(readersEarly(), "/", readers());

// Deep nesting: records holding unions holding records with string fields,
// dropped en masse when the outer binding is reassigned.
type Deep = { kind: "leaf"; label: string } | { kind: "pair"; left: string; right: string };
let deep: { d: Deep } = { d: { kind: "leaf", label: "one" } };
for (let i = 0; i < 25; i = i + 1) {
  deep = { d: i % 2 === 0 ? { kind: "pair", left: `L${i}`, right: `R${i}` } : { kind: "leaf", label: `leaf${i}` } };
}
if (deep.d.kind === "leaf") {
  console.log("deep leaf", deep.d.label);
} else {
  console.log("deep pair", deep.d.left, deep.d.right);
}

// NaN payloads round-trip through the f64 arm.
const nan = 0 / 0;
const weird: Cell = count(nan);
console.log(read(weird), read(count(-0)));
