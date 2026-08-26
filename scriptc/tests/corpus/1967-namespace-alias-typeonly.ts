// @exit: 1
// @transform-types
// An import= alias of a TYPE-ONLY namespace: Node's transform always
// emits `var P = T` (it never elides type-only aliases the way tsc's emit
// does), and an uninstantiated namespace has no runtime binding — the
// alias statement itself throws ReferenceError and nothing after it runs.
// Byte-exact stdout up to the crash, exit 1 like Node.
namespace T {
  export interface I {
    a: number;
  }
}

console.log("before the alias");
import P = T;
console.log("never reached");
const unused: P.I = { a: 1 };
console.log(unused.a);
