// JSON.stringify over a dyn ROOT (unknown and the top object types): the
// runtime's dyn walker serializes what the type-directed serializers
// cannot see statically — the JSON.parse round-trip, unknown-typed locals,
// `{}`/`Object`/`object` slots. Number/string/bool/null/array/object are
// JS-exact; undefined MEMBERS drop like Node's; the pretty-print form
// re-indents the walker's compact text with the same gap algorithm.

// The round-trip: parse → unknown → stringify, with JS number spelling.
const parsed: unknown = JSON.parse('{"b":2,"a":[1,2.5,null],"s":"x"}');
console.log(JSON.stringify(parsed));

// Primitives and null through unknown roots.
const un: unknown = 42;
const us: unknown = "quote\"me";
const ub: unknown = false;
const unl: unknown = null;
console.log(JSON.stringify(un), JSON.stringify(us), JSON.stringify(ub), JSON.stringify(unl));

// A record built statically, stringified through an unknown slot: field
// order is insertion order, nested arrays/records walk recursively.
const u: unknown = { z: 1, a: { inner: [true, "t"] }, list: [3, 4] };
console.log(JSON.stringify(u));

// Top object types take the same walker.
const t1: {} = { k: "v" };
const t2: Object = [1, "two", null];
const t3: object = { nested: { n: 0.5 } };
console.log(JSON.stringify(t1), JSON.stringify(t2), JSON.stringify(t3));

// The pretty-print form over a dyn root: Node's space rules on the
// walker's compact output.
const pretty: unknown = JSON.parse('{"a":1,"b":[true,null]}');
console.log(JSON.stringify(pretty, null, 2));

// Non-finite numbers inside the checked-dynamic tree serialize as null, like Node.
const nf: unknown = { inf: Infinity, nan: 0 / 0, neg: -0 };
console.log(JSON.stringify(nf));
