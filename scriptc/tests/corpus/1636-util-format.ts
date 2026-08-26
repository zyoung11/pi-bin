// util.format: the %-substitution loop ported at compile time over
// literal format strings — %s (numbers via the -0-aware formatter,
// strings verbatim, composites through inspect at depth 0), %d, %i
// (parseInt-over-ToString), %j (JSON.stringify), %O (default inspect),
// %c (consume and drop), %% — the args-exhausted literal passthrough,
// and space-joined extra args. formatWithOptions({}) is format. Node is
// the oracle byte-for-byte.
import { format, formatWithOptions } from "node:util";

console.log(format());
console.log(format("plain"));
console.log(format("a", "b", "c"));

// %s conversions per type
console.log(format("%s", "str"));
console.log(format("%s", 42));
console.log(format("%s", -0));
console.log(format("%s", 1e21));
const nan = 0 / 0;
console.log(format("%s", nan));
console.log(format("%s", true));
console.log(format("%s", null));
console.log(format("%s", undefined));
console.log(format("%s", [1, 2, 3]));
console.log(format("%s", { k: 1 }));
console.log(format("%s", [[1], [2]])); // depth 0: nested → [Array]
console.log(format("%s", { a: { b: 1 } }));

// %d and %i
console.log(format("%d", 3.14));
console.log(format("%d", -0));
console.log(format("%d", true));
console.log(format("%d", false));
console.log(format("%i", 9.99));
console.log(format("%i", -42.7));
console.log(format("%i", "12px"));
console.log(format("%i", "not a number"));
console.log(format("%i", 1e21));

// %j
console.log(format("%j", { arr: [1, "two"], k: 1 }));
console.log(format("%j", [1, 2]));
console.log(format("%j", "str"));
console.log(format("%j", undefined));

// %O — full inspect at the defaults
console.log(format("%O", { a: { b: { c: 1 } } }));
console.log(format("%O", [1, 2, 3]));

// %% and %c and unknown specifiers
console.log(format("100%%"));
console.log(format("%"));
console.log(format("%q unknown", 1));
console.log(format("a%cb", "consumed"));
console.log(format("x%cy%sz", "gone", "kept"));

// args exhausted: specifiers stay literal
console.log(format("%s %s", "one"));
console.log(format("%s and %d", "only"));
console.log(format("%%", "extra"));

// mixed substitution + extra args
console.log(format("%s=%d", "k", 5, "tail", { obj: 1 }, [9]));
console.log(format("no specs", 1, true, null, undefined, "s"));

// non-literal first argument: single-arg and non-string-first forms
const runtime = ["dyn", "amic"].join("");
console.log(format(runtime));
console.log(format(42, "next", 7));
console.log(format(["arr"], "x"));

// formatWithOptions with the empty (default) options literal
console.log(formatWithOptions({}, "%s %d", "v", 8));
