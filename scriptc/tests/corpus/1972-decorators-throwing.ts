// @exit: 1
// @tsc-decorators
// A throwing class decorator: the decoration call runs at the class
// statement's evaluation, so the module dies there — statements above run,
// the class statement and everything below never complete. stdout is
// compared (the uncaught report's format on stderr is the documented
// divergence).

console.log("before");

function boom(t: typeof Doomed): void {
  console.log("decorating", t.name);
  throw new Error("decorator failed");
}

function never(t: typeof Doomed): void {
  console.log("unreachable application");
}

// boom applies FIRST (reverse order) and throws; never's application and
// the static block are never reached.
@never
@boom
class Doomed {
  static {
    console.log("unreachable static block");
  }
}

console.log("after");
