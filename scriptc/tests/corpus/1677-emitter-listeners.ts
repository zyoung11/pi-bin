// EventEmitter listeners()/rawListeners(): a fresh closure array of the
// ORIGINALS in list order, element-typed by the event's unified tuple.
// Prefix listeners called through the full-tuple element type ignore the
// extra trailing arguments — JS's semantics. Both members answer the
// originals (the once wrapper is runtime-internal; rawListeners' wrapper
// identity is the documented divergence).
import { EventEmitter } from "node:events";
import assert from "node:assert";

const ee = new EventEmitter();
const seen: string[] = [];

function full(a: string, b: number): void { seen.push(`full ${a} ${b}`); }
function prefix(a: string): void { seen.push(`prefix ${a}`); }
function bare(): void { seen.push("bare"); }

ee.on("evt", full);
ee.on("evt", prefix);
ee.once("evt", bare);

// (Binding the result to a plain const adopts the checker's Function[]
// view, which has no honest element signature — the introspection reads
// stay inline, where the event's tuple types the elements.)
console.log(ee.listeners("evt").length);
console.log(ee.listeners("evt")[0] === full, ee.listeners("evt")[1] === prefix, ee.listeners("evt")[2] === bare);
console.log(ee.rawListeners("evt").length);

// Calling a snapshot element delivers exactly what emit would; the
// prefix listener ignores the extra argument, like JS.
(ee.listeners("evt")[0] as (a: string, b: number) => void)("snap", 1);
(ee.listeners("evt")[1] as (a: string, b: number) => void)("snap", 2);
console.log(seen.join(" | "));

ee.emit("evt", "go", 3);
console.log(seen.join(" | "));

// The snapshot is FRESH: mutating it never touches the registry — and
// the once listener already left the live list.
console.log(ee.listeners("evt").length, ee.listenerCount("evt"));

ee.removeListener("evt", prefix);
console.log(ee.listeners("evt").length);
console.log(ee.listeners("evt")[0] === full);

// Same-signature listeners deep-compare by identity, and an empty
// literal adopts the other side's element type.
function h1(): void { seen.push("h1"); }
function h2(): void { seen.push("h2"); }
ee.on("plain", h1);
ee.on("plain", h2);
assert.deepStrictEqual(ee.listeners("plain"), [h1, h2]);
ee.removeAllListeners("plain");
assert.deepStrictEqual(ee.listeners("plain"), []);
assert.deepStrictEqual(ee.listeners("never-registered"), []);
console.log("ok");
