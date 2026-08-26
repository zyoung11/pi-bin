// SC2007: values of overloaded function type — a compiled function VALUE is
// one concrete signature. Calls of overloaded declarations resolve per call
// site; it is the value position that fences.

function pick(x: "a"): string;
function pick(x: "b"): number;
function pick(x: string): string | number {
  return x === "a" ? "A" : 1;
}
const stored = pick;
console.log(stored("a"));

// An overloaded TYPE LITERAL slot fences the same way. The value arrives
// through a cast, not an ambient declare (a declare-rooted chain would
// compile to Node's ReferenceError at the root instead).
const on = ((() => {}) as unknown) as { (event: "exit", code: number): void; (event: "error", err: string): void };
const listener = on;
console.log(listener("exit", 0));
