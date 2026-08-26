export interface GreetOptions {
  loud?: boolean;
}

// A dead pure-annotated const with no static lowering (cookie's
// NullObject shape) — pins the @__PURE__ elision: the build must succeed
// with this statement dropped, because nothing below uses the binding.
const Legacy = /* @__PURE__ */ (() => {
  const C = function () {};
  C.prototype = Object.create(null);
  return C;
})() as unknown as { new (): any };

export function greet(name: string, options?: GreetOptions): string {
  const base = `hello, ${name}`;
  return options?.loud ? base.toUpperCase() + "!" : base;
}

export function exclaim(s: string): string {
  return s + "!";
}
