// Default parameter values: JS evaluates a default at CALL time, in the
// callee scope, left-to-right, exactly when the argument is omitted or
// undefined — the side-effect prints pin that order.
function loudSeven(): number {
  console.log("evaluating seven");
  return 7;
}
function loudTen(): number {
  console.log("evaluating ten");
  return 10;
}
function pair(a: number = loudSeven(), b: number = loudTen()): string {
  return a + "/" + b;
}
console.log(pair());
console.log(pair(1));
console.log(pair(1, 2));
// Explicit undefined triggers the default, positionally.
console.log(pair(undefined, 2));
console.log(pair(1, undefined));

// Defaults may reference EARLIER parameters (already bound when it runs).
function scale(base: number, factor: number = base * 2, label: string = "x" + factor): string {
  return label + ":" + base * factor;
}
console.log(scale(3));
console.log(scale(3, 10));
console.log(scale(3, 10, "custom"));
console.log(scale(3, undefined, "half"));

// String defaults: the default allocates only when it actually runs.
function wrap(s: string, open: string = "<" + s + ">", n: number = open.length): string {
  return open + s + open + ":" + n;
}
console.log(wrap("a"));
console.log(wrap("a", "[["));

// `x: T | undefined = e` is the same completed signature as `x?: T` — the
// body sees plain T (tsc strips undefined through the default).
function pick(x: string | undefined = "fallback"): string {
  return x;
}
console.log(pick(), pick("given"), pick(undefined));

// Defaults on methods may use `this` (param 0) and earlier params.
class Counter {
  step: number = 3;
  bump(times: number = 2, by: number = this.step * times): number {
    return times * by;
  }
}
const c = new Counter();
console.log(c.bump(), c.bump(4), c.bump(4, 1), c.bump(undefined, 5));

// A default AFTER a required param still defaults on explicit undefined.
function mix(a: number = 1, b: number): number {
  return a * 100 + b;
}
console.log(mix(undefined, 5), mix(2, 5));

// Defaults in lambdas, through a target spelling the completed signature.
const fmt: (n: number | undefined) => string = (n: number = 42) => "n=" + n;
console.log(fmt(undefined), fmt(7));

// Record and array defaults allocate fresh per defaulted call (JS-exact).
function point(p: { x: number; y: number } = { x: 1, y: 2 }): number {
  p.x += 10;
  return p.x + p.y;
}
console.log(point(), point(), point({ x: 5, y: 5 }));
function push3(arr: number[] = []): number {
  arr.push(3);
  return arr.length;
}
console.log(push3(), push3(), push3([1, 2]));
