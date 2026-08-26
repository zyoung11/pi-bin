// @exit: 1
// A property/method chain rooted at an initializer-less ambient
// `declare var` whose type has no static mapping compiles to Node's
// ReferenceError AT THE ROOT — the chain form of the declare-const
// stance: the throw happens before the member, the arguments, or the
// call, so everything printed before it still matches Node.
declare var pair: [number, string] | [number, string, string];
console.log("before the ambient read");
pair.slice(1) as readonly string[];
console.log("unreachable");
