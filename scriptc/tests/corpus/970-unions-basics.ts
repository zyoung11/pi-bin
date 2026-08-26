// Discriminated unions: tagged representation with checker-driven
// narrowing. Construction is implicit (an arm value flowing into a
// union-typed slot wraps), and inside a discriminant guard tsc narrows the
// binding to the arm — reads extract the payload.
type Res = { kind: "ok"; value: number } | { kind: "err"; message: string };

function classify(n: number): Res {
  if (n >= 0) {
    return { kind: "ok", value: n * 2 };
  }
  return { kind: "err", message: `negative ${n}` };
}

function show(r: Res): string {
  if (r.kind === "ok") {
    return `ok(${r.value})`;
  } else {
    return `err(${r.message})`;
  }
}

for (let i = -2; i < 3; i = i + 1) {
  const r = classify(i);
  // The discriminant itself is an ordinary string once read.
  console.log(show(r), r.kind, r.kind === "ok");
}

// Negated guards narrow the else side; early returns narrow the rest.
function firstWord(r: Res): string {
  if (r.kind !== "ok") {
    return r.message;
  }
  return "value " + r.value;
}
console.log(firstWord(classify(3)), "|", firstWord(classify(-3)));

// let-reassignment constructs a fresh union value each time.
let cur: Res = classify(-1);
console.log(show(cur));
cur = classify(4);
console.log(show(cur));
cur = { kind: "err", message: "manual" };
console.log(show(cur));

// Scalar arms: number | string with NaN and -0 riding the f64 arm.
type NumOrName = { t: "n"; v: number } | { t: "s"; v: string };
function pick(x: NumOrName): string {
  if (x.t === "n") {
    return `num ${x.v}`;
  }
  return `str ${x.v}`;
}
const nan = 0 / 0;
console.log(pick({ t: "n", v: nan }), pick({ t: "n", v: -0 }), pick({ t: "s", v: "" }));
function numOf(x: NumOrName): number {
  if (x.t === "n") {
    return x.v;
  }
  return -1;
}
console.log(numOf({ t: "n", v: -0 }), 1 / numOf({ t: "n", v: -0 }));

// Narrowing persists into closures created after the guard (const only).
const stable = classify(8);
if (stable.kind === "ok") {
  const readIt = (): string => `closed over ${stable.value}`;
  console.log(readIt());
}

// The wrapped payload keeps its identity: narrowing twice yields the SAME
// record (reference equality), exactly like JS aliasing.
const src = classify(5);
if (src.kind === "ok") {
  const a = src;
  const b = src;
  console.log(a === b, a.value === b.value);
}

// Ternaries build unions too: each arm wraps into the union type.
function flip(b: boolean): Res {
  return b ? { kind: "ok", value: 1 } : { kind: "err", message: "no" };
}
console.log(show(flip(true)), show(flip(false)));

// A bare number | string union: constructible, reassignable, passable —
// consumed where a discriminated wrapper narrows it back out.
function stash(v: number | string): NumOrName {
  return { t: "s", v: `<${typeofish(v)}>` };
}
function typeofish(v: number | string): string {
  return "opaque";
}
let bag: number | string = 7;
bag = "lunch";
console.log(pick(stash(bag)));
