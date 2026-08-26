// `any` in function signatures: any-typed parameters box their arguments
// into the checked-dynamic tree (deep copy), any-typed returns flow out as checked-dynamic
// values, overload implementations typed `any` serve concrete overload
// signatures through validated exits, and functions STORED in any-typed
// bindings call through the boxed thunk with JS arity.

// any params take every dyn-representable argument.
function show(x: any): string {
  return typeof x;
}
console.log(show(1), show("s"), show(true), show(null), show(undefined));
console.log(show({ a: 1 }), show([1, 2]), show(() => 0));

// any returns validate into typed slots at the call site.
function answer(): any {
  return 42;
}
const n: number = answer();
console.log(n + 1);

// The identity shape behind overload signatures: the implementation is
// (bar: any) => any, the call sites resolve concrete signatures.
function pick(bar: string): string;
function pick(bar: number): number;
function pick(bar: any): any {
  return bar;
}
const s: string = pick("chosen");
const m: number = pick(7);
console.log(s, m);

// A function value stored in an any binding: the call goes through the
// boxed thunk — arguments validate per declared param, result boxes back.
const f: any = (x: number): number => x * 3;
console.log(f(2));
console.log(typeof f);

// Predicates with any params: the binding keeps its func-ness (only the
// any pieces fall to dyn), and the predicate narrows at call sites.
const isString = (value: any): value is string => {
  return typeof value === "string";
};
console.log(isString("yes"), isString(4));
function widen(): string | number {
  return "w";
}
const w = widen();
if (isString(w)) {
  console.log(w.length);
}

// any params defaulting through omitted concrete args — undefined arrives.
function tail(a: number, b: any): string {
  return `${a}:${typeof b}`;
}
console.log(tail(1, undefined));
console.log(tail(2, "here"));

// OPTIONAL any/unknown params: an omitted call passes the dyn undefined.
function opt(bar?: any): string {
  return typeof bar;
}
console.log(opt(), opt(5), opt("s"));
function optU(x?: unknown): string {
  return typeof x;
}
console.log(optU(), optU(true));
