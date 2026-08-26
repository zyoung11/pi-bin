// Object-literal GENERIC methods: the member is excluded from the record
// shape (no closure slot can hold a generic function — JSON.stringify
// drops function properties, so serialization stays Node-exact) and calls
// resolve statically against the defining literal, monomorphized per call
// site. Generic arrow properties ride the same machinery.
const util = {
  version: 3,
  id<T>(value: T): T {
    return value;
  },
  twice: <T>(v: T): T[] => [v, v],
  label: <T>(v: T): string => {
    return `<${String(v)}>`;
  },
};

console.log(util.id(5) + 2);
console.log(util.id("obj").toUpperCase());
console.log(util.id<boolean>(true));
console.log(util.twice("t").length, util.twice(1)[0]);
console.log(util.label(42));
console.log(util.version);

// Optional parameters complete like any generic call (the conformance
// optionalParameterRetainsNull shape).
interface Bar {
  bar: number;
  foo: string | null;
}
// A LET receiver resolves too when nothing in the file ever reassigns it
// (ESM import bindings are read-only, so the file scan is the whole story).
let a = {
  test<K extends keyof Bar>(k: K, b?: Bar[K] | null): string {
    return `${k}:${String(b)}`;
  },
};
console.log(a.test("bar", null));
console.log(a.test("foo"));

// The data half of the shape is an ordinary record: it stringifies with
// the generic members dropped, exactly Node.
console.log(JSON.stringify({ n: 1, id: <T>(x: T): T => x }));

// A PINNED value of an object-literal generic method is the instance's
// closure (the generic-function pinned-value rule).
const g: (s: string) => string = util.id;
console.log(g("pinned"));
function take(f: (n: number) => number[]): number {
  return f(7).length;
}
console.log(take(util.twice));
