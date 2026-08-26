// Generic functions as VALUES, monomorphized by flow: a pinned reference
// (contextual type or instantiation expression) names the instance, and the
// value is that instance's interned closure — shared with call sites.
function identity<T>(x: T): T {
  return x;
}
function pair<A, B>(a: A, b: B): string {
  return `${a}|${b}`;
}
function tail<T>(xs: T[]): T[] {
  return xs.slice(1);
}
function orDefault<T = string>(x: T): T {
  return x;
}

// Contextual pinning: the annotated slot completes the signature.
const f: (x: number) => number = identity;
console.log(f(41) + 1);
const g: (a: number, b: string) => string = pair;
console.log(g(7, "seven"));

// Instantiation expressions: explicit type arguments pin.
const h = identity<string>;
console.log(h("hello").toUpperCase());
const t = tail<number>;
console.log(t([1, 2, 3]).join(","));

// Argument positions: the parameter's type is the context.
console.log([1, 2, 3].map(identity).join("+"));
function apply(cb: (s: string) => string, v: string): string {
  return cb(v);
}
console.log(apply(identity, "applied"));

// One instance per signature, however it is reached: identity within an
// instantiation is function identity (Node: always the one `identity`).
const f2: (x: number) => number = identity;
console.log(f === f2);
console.log(h === identity<string>);

// A call and a pinned value share the compiled instance; both agree.
console.log(identity(1) === f(1));

// Type-parameter defaults participate (`<T = string>` fills unpinned slots).
const d = orDefault<number>;
console.log(d(2) + orDefault<number>(3));

// Async generic values: the instance is an async function like any other.
async function later<T>(v: T): Promise<T> {
  return v;
}
const lf: (v: string) => Promise<string> = later;
lf("async-ok").then((v) => console.log(v));
