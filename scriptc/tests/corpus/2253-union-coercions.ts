// Arm-wise union coercions at assignability boundaries — the Node-exact
// families (the lying-cast TRAP family lives in dyncheck.test.ts: Node
// never checks a cast, so it cannot sit in a differential corpus):
// 1. A checker-NARROWED union value flowing into its proven arm (the
//    destructured-binding and `d ?? (d = ...)` idioms) takes the checked
//    extraction — sound narrowing never traps.
type Foo = { bar: number | null; baz: string };
const aFoo: Foo = { bar: 3, baz: "b" };
if (aFoo.bar) {
  const { bar, baz } = aFoo;
  const narrowed: number = bar;
  console.log(narrowed + 1, baz);
}
let d: string | undefined;
const x: string | undefined = "q";
d ?? (d = x ?? "fallback");
console.log(d.length);
let e: string | undefined;
e ??= "wide";
console.log(e.length);

// 2. A VOID call result flowing into an undefined-armed slot: the void
//    value IS undefined (the call still runs — effects first).
let effects = 0;
function voidFn(): void {
  effects++;
}
var r = voidFn();
console.log(String(r), effects);
const v = function (): boolean | void {
  if (effects > 0) return true;
  return voidFn();
};
const got = v();
console.log(typeof got === "boolean" ? `bool:${got}` : String(got));

// 3. `this` parameters are type-world only: callers never pass them.
function isFoo(this: void, object: { kind: string }): boolean {
  return object.kind === "foo";
}
console.log(isFoo({ kind: "foo" }), isFoo({ kind: "bar" }));

// 4. Function-value adapters: fewer parameters (JS ignores extras), and
//    results that wrap into the slot's union arm.
type Callback = (x?: string) => void;
let seen = "";
const cb: Callback = function () {
  seen += "ran;";
};
cb("ignored");
cb();
console.log(seen);
type Producer = () => string | undefined;
const make: Producer = function (): string {
  return "made";
};
console.log(String(make()));

// 5. Spreading a narrower-element array into a union-element literal
//    wraps per element.
const nums = [1, 2];
const strs = ["a"];
const joined: (number | string)[] = [...nums, ...strs];
console.log(joined.length, `${joined[0]}${joined[2]}`);
