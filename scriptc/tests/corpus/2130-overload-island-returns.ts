// @dynamic
// Overload RETURN types are claims tsc never checks against the
// implementation body — only the implementation signature is (TS's
// documented overload unsoundness). When the implementation returns an
// island value ('any'), the resolved overload's primitive return must NOT
// trap-extract at the call: the binding stores the HANDLE — exactly the
// value Node's binding holds — and uses dispatch to engine ops
// (functionOverloads35-42's shape; reconcileOverloadReturn +
// uncheckedOverloadHandleCall).

// The record family: the implementation returns its object argument under
// primitive-returning overloads. Node runs clean; so must we.
function foo(bar: { a: number }): number;
function foo(bar: { a: string }): string;
function foo(bar: { a: any }): any {
  return bar;
}
var x = foo({ a: 1 });
console.log(typeof x);
const xs = foo({ a: "s" });
console.log(typeof xs);

// The array-parameter members of the family.
function arr(bar: { a: number }[]): string;
function arr(bar: { a: any }[]): number;
function arr(bar: { a: any }[]): any {
  return bar;
}
const y = arr([{ a: "s" }]);
console.log(typeof y);

// Function-scope bindings: let, const, and the hoisted var all store the
// handle; typeof reads through the engine.
function scoped(): string {
  const a = foo({ a: 1 });
  var b = foo({ a: "s" });
  let c = arr([{ a: 2 }]);
  return `${typeof a} ${typeof b} ${typeof c}`;
}
console.log(scoped());

// When the implementation's island value REALLY IS the claimed primitive,
// the handle still flows — engine typeof answers the honest kind.
function pick(bar: { a: number }): number;
function pick(bar: { a: string }): string;
function pick(bar: { a: any }): any {
  return bar.a;
}
const n = pick({ a: 41 });
console.log(typeof n);
const s = pick({ a: "str" });
console.log(typeof s);
