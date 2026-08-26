// Unions embedded in the rest of the language: record fields, class
// fields, function params/returns, closures capturing union locals (the
// box path), and generic functions instantiated over union types.
type Res = { kind: "ok"; value: number } | { kind: "err"; message: string };

function ok(value: number): Res {
  return { kind: "ok", value };
}
function err(message: string): Res {
  return { kind: "err", message };
}
function show(r: Res): string {
  if (r.kind === "ok") {
    return `ok(${r.value})`;
  }
  return `err(${r.message})`;
}

// Union-typed record fields (a union nested in a record).
type Attempt = { name: string; result: Res };
const first: Attempt = { name: "boot", result: ok(1) };
const second: Attempt = { name: "load", result: err("missing") };
console.log(first.name, show(first.result), second.name, show(second.result));
// Field writes replace the whole (immutable) union value.
second.result = ok(99);
console.log(second.name, show(second.result));
// Property-chain narrowing: tsc narrows `second.result` itself.
if (second.result.kind === "ok") {
  console.log("chain narrow", second.result.value);
}

// Union-typed class fields, narrowed through method calls and chains.
class Slot {
  latest: Res = err("empty");
  update(n: number): string {
    this.latest = n >= 0 ? ok(n) : err(`bad ${n}`);
    return show(this.latest);
  }
}
const slot = new Slot();
console.log(show(slot.latest), slot.update(5), slot.update(-1));
if (slot.latest.kind === "err") {
  console.log("slot holds", slot.latest.message);
}

// Closures capture union locals as shared boxed bindings.
function makeTracker(): { push: (r: Res) => string; last: () => string } {
  let held: Res = err("nothing yet");
  let count = 0;
  const push = (r: Res): string => {
    held = r;
    count = count + 1;
    return `#${count} ${show(held)}`;
  };
  const last = (): string => show(held);
  return { push, last };
}
const tracker = makeTracker();
console.log(tracker.last());
console.log(tracker.push(ok(7)), tracker.push(err("oops")), tracker.last());

// Generic functions instantiate over union types (one instance per union).
function idu<T>(x: T): T {
  return x;
}
function boxed<T>(x: T): { inner: T } {
  return { inner: x };
}
console.log(show(idu(ok(3))), show(idu(err("generic"))));
const wrapped = boxed(ok(11));
console.log(show(wrapped.inner));
const viaGenerics: Res = idu(idu(err("twice")));
console.log(show(viaGenerics));

// Union-typed parameters of closures called indirectly.
const apply = (f: (r: Res) => string, r: Res): string => f(r);
console.log(apply(show, ok(0)), apply(show, err("indirect")));

// number | string arms round-tripping through a discriminated record.
type Raw = { has: "num"; n: number } | { has: "str"; s: string };
function lift(v: number | string, tagAsNum: boolean): Raw {
  if (tagAsNum) {
    return { has: "num", n: -0 };
  }
  return { has: "str", s: `held ${sizeOf(v)}` };
}
function sizeOf(v: number | string): number {
  return 8;
}
function render(r: Raw): string {
  if (r.has === "num") {
    return `n=${r.n} sign=${1 / r.n}`;
  }
  return r.s;
}
let mixed: number | string = "abc";
console.log(render(lift(mixed, true)));
mixed = 42;
console.log(render(lift(mixed, false)));
