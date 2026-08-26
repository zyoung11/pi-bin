// Generators as values: function* expressions, object-literal *methods,
// lifted generators capturing enclosing state, function identity, and a
// deliberately ABANDONED suspended generator (its fiber is reclaimed at
// exit — the RC audit's abandoned-fiber note, filtered by the harness).
const v = function* (): Generator<number, void, unknown> {
  yield 10;
  yield 20;
};
for (const x of v()) console.log(x);
const obj = {
  *foo(): Generator<string, void, unknown> {
    yield "m1";
    yield "m2";
  },
};
for (const s of obj.foo()) console.log(s);

function make(start: number): () => Generator<number, void, unknown> {
  let n = start;
  return function* (): Generator<number, void, unknown> {
    yield n;
    n += 1;
    yield n;
  };
}
const gen = make(100);
for (const x of gen()) console.log(x);
for (const x of gen()) console.log("again", x);

function* named(): Generator<number, void, unknown> {
  yield 1;
}
const f = named;
console.log(f === named);

// records and arrays yielded (ownership moves through the channel)
type P = { x: number; y: string };
function* points(): Generator<P, void, unknown> {
  yield { x: 1, y: "a" };
  yield { x: 2, y: "b" };
}
for (const p of points()) console.log(p.x, p.y);
function* rows(): Generator<string[], void, unknown> {
  yield ["r0a", "r0b"];
  yield ["r1a"];
}
for (const row of rows()) console.log(row.length, row[0]!);

// union yields drive through .next() and narrow by typeof
function* mixed(): Generator<number | string, void, unknown> {
  yield 1;
  yield "two";
  yield 3;
}
const m = mixed();
let mr = m.next();
while (!mr.done) {
  const val = mr.value;
  if (typeof val === "number") console.log("num", val);
  else if (typeof val === "string") console.log("str", val);
  mr = m.next();
}

// abandoned mid-drain: the suspended fiber leaks deliberately (Node's GC
// never runs finallys either — no output expected from this one)
function* leaky(): Generator<number, void, unknown> {
  try {
    yield 1;
    yield 2;
  } finally {
    console.log("leaky finally must not run");
  }
}
const lk = leaky();
console.log(lk.next().value as number);
console.log("end");
