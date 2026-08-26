// Every supported import spelling binds the same assert surface: the
// default import (callable module object), named imports (aliased too),
// the bare and node:-prefixed specifiers, and the namespace import for
// member calls.
import assert from "assert";
import { ok, strictEqual as mustEqual, deepStrictEqual } from "node:assert";
import * as assertNs from "node:assert";

assert(true, "callable module");
assert.ok(1);
ok("named import");
mustEqual(3 * 3, 9);
deepStrictEqual({ k: [true] }, { k: [true] });
assertNs.ok("namespace member calls work");
assertNs.strictEqual("ns", "ns");

// The generated message renders the spelling AS WRITTEN at the call.
try {
  ok(false);
} catch (e) {
  if (e instanceof Error) console.log(JSON.stringify(e.message));
}
try {
  mustEqual(1, 2);
} catch (e) {
  if (e instanceof Error) console.log(JSON.stringify(e.message));
}
try {
  assertNs.ok(0);
} catch (e) {
  if (e instanceof Error) console.log(JSON.stringify(e.message));
}
console.log("done");
