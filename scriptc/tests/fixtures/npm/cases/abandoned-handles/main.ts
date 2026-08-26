// An ABANDONED fiber holding island handles: the fiber parks forever on a
// static promise while its frame owns package values (the Counter cell).
// Loop exhaustion exits 0 like Node — and teardown must free the engine
// values nothing will ever release (the abandoned stack is deliberately
// not unwound), or the engine goes down dirty: the sanitized lane's debug
// engine asserts on leaked values at JS_FreeRuntime, and the island's
// counting allocator must return to zero.
import { Counter } from "counter";

async function run(): Promise<void> {
  const held = new Counter(7);
  const before: string = held.label("held");
  console.log(before);
  await new Promise<void>(() => {});
  const after: string = held.label("unreached");
  console.log(after);
}
run();
console.log("main done");
