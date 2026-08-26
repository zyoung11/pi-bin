// @exit: 1
// @tsc-decorators
// An AMBIENT decorator (`declare` — nothing defines it): Node erases the
// declaration, so evaluating the decorator expression throws the
// ReferenceError when the class statement runs. Earlier decorator
// expressions (the factory) still evaluate — TC39 evaluates all decorator
// expressions in source order before any application — and nothing after
// the throw runs: not the factory's application, not the static block,
// not the statements below.

declare function vanish<T>(target: T): T;

function mk(label: string): (t: typeof Doomed) => void {
  console.log("factory", label);
  return (t: typeof Doomed) => console.log("apply", label);
}

console.log("before");

@mk("first")
@vanish
class Doomed {
  static {
    console.log("unreachable static block");
  }
}

console.log("after");
