// Generic arrow functions and function expressions bound to never-reassigned
// bindings monomorphize per call-site-resolved signature, exactly like
// top-level generic function declarations: the binding provably holds its
// initializer forever, so calls resolve statically and the binding itself
// never exists at runtime.
const identity = <T>(x: T): T => x;
const pair = function <A, B>(a: A, b: B): string {
  return `${a}|${b}`;
};

// Direct calls: inference and explicit type arguments.
console.log(identity(41) + 1);
console.log(identity("hello").toUpperCase());
console.log(identity<boolean>(true));
console.log(pair(7, "seven"));
console.log(pair<string, number>("n", 9));

// Contextual pinning: the annotated slot completes the signature, and the
// pinned value shares the call sites' instance table.
const f: (x: number) => number = identity;
console.log(f(1) === identity(1));
const f2: (x: number) => number = identity;
console.log(f === f2);

// Instantiation expressions pin too.
const h = identity<string>;
console.log(h("inst"));
console.log(h === identity<string>);

// Argument positions: the parameter's type is the context.
console.log([1, 2, 3].map(identity).join("+"));
function apply(cb: (s: string) => string, v: string): string {
  return cb(v);
}
console.log(apply(identity, "applied"));

// Recursion through the binding name converges on one instance per key.
const len = <T>(xs: T[]): number => (xs.length === 0 ? 0 : 1 + len(xs.slice(1)));
console.log(len([1, 2, 3]), len(["a", "b"]));

// A NAMED function expression binds its own name inside the body (the
// class-expression rule): inner recursion lands on the same instance table.
const countdown = function go<T>(n: number, acc: T[]): number {
  return n === 0 ? acc.length : go(n - 1, acc);
};
console.log(countdown(3, ["x", "y"]));

// Optional and defaulted parameters complete per instantiation.
const tag = <T>(x: T, prefix = "t"): string => `${prefix}:${x}`;
console.log(tag(1), tag("a", "p"), tag(false));

// Instance bodies read module-scope state like any module function.
const base = 100;
const plus = <T>(x: T): string => `${base}+${x}`;
console.log(plus(5), plus("s"));

// Generic-to-generic call chains through bindings.
const wrap = <T>(x: T): T[] => [identity(x)];
console.log(wrap(7)[0], wrap("w")[0]);

// A `let` (or `var`) nothing ever writes qualifies like a const; unused
// generic bindings cost nothing.
let lenient = <T>(x: T, y: T): T => y;
console.log(lenient(1, 2), lenient("a", "b"));
var hoisted = function <T>(a: T): T {
  return a;
};
console.log(hoisted("var-ok"));
const unused = <A, B>(a: A, b: B): A => a;

// Block-scoped bindings register at their statement, before any use.
{
  const inner = <T>(x: T): T => x;
  console.log(inner(9), inner("blk"));
}

// Async generic bindings: instances ride the spawn-wrapper machinery.
const later = async <T>(v: T): Promise<T> => v;
const lf: (v: string) => Promise<string> = later;
lf("async-ok").then((v) => console.log(v));
later(11).then((n) => console.log(n + 1));
