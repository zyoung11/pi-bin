// A caught AssertionError answers like Node's: instanceof Error (but not
// TypeError), name "AssertionError", code "ERR_ASSERTION", and the
// generated .message — assert.ok's source-text form, strictEqual's
// short `a !== b` form, and the custom-message pass-through.
import assert from "node:assert";

function messageOf(f: () => void): string {
  try {
    f();
    return "DID NOT THROW";
  } catch (e) {
    return e instanceof Error ? e.message : "not an Error";
  }
}

try {
  assert.ok(false);
} catch (e) {
  if (e instanceof Error) {
    console.log("instanceof Error:", true);
    console.log("instanceof TypeError:", e instanceof TypeError);
    console.log("name:", e.name);
    console.log("code:", `${(e as NodeJS.ErrnoException).code}`);
    console.log("toString:", e.toString());
  }
}

// The generated ok message carries the call's source text.
console.log(JSON.stringify(messageOf(() => assert.ok(false))));
console.log(JSON.stringify(messageOf(() => assert.ok(1 > 2, "one exceeds two"))));

// assert() and destructured ok() render their own spellings.
try {
  assert(false);
} catch (e) {
  if (e instanceof Error) console.log(JSON.stringify(e.message));
}

// fail(): "Failed" by default, the message otherwise.
console.log(JSON.stringify(messageOf(() => assert.fail())));
console.log(JSON.stringify(messageOf(() => assert.fail("custom failure"))));

// A custom message passes through the not-equal operators untouched and
// heads the strictEqual diff.
console.log(JSON.stringify(messageOf(() => assert.notStrictEqual(5, 5, "same five"))));
console.log(JSON.stringify(messageOf(() => assert.strictEqual(1, 2, "custom head"))));

// Failures are catchable and execution continues.
console.log("done");
