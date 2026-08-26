// assert.throws — the bare form (any throw passes), the message-string
// form, and the error-class form (instanceof match passes; a
// non-matching Error throws Node's mismatch AssertionError). assert.match
// and doesNotMatch — the generated messages carry the regex (flags in
// getter order) and the inspected input.
import assert from "node:assert";

class AppError extends Error {}

function messageOf(f: () => void): string {
  try {
    f();
    return "DID NOT THROW";
  } catch (e) {
    return e instanceof Error ? e.message : "not an Error";
  }
}

// Bare: any throw satisfies it; the callback runs exactly once.
let runs = 0;
assert.throws(() => {
  runs += 1;
  throw new Error("thrown");
});
console.log("runs:", runs);

// Class form: exact class and subclass both match.
assert.throws(() => {
  throw new TypeError("t");
}, TypeError);
assert.throws(() => {
  throw new TypeError("t");
}, Error);
assert.throws(() => {
  throw new AppError("app");
}, AppError);
assert.throws(() => {
  throw new AppError("app");
}, Error);
console.log("class matches ok");

// No throw: "Missing expected exception." — with the message form's tail.
console.log(JSON.stringify(messageOf(() => assert.throws(() => {}))));
console.log(JSON.stringify(messageOf(() => assert.throws(() => {}, "should have thrown"))));

// Mismatched class: Node's mismatch AssertionError, catchable.
console.log(JSON.stringify(messageOf(() => assert.throws(() => {
  throw new RangeError("out of range");
}, TypeError))));

// match / doesNotMatch generated messages.
console.log(JSON.stringify(messageOf(() => assert.match("abc", /xyz/))));
console.log(JSON.stringify(messageOf(() => assert.match("l i n e", /^\d+$/m))));
console.log(JSON.stringify(messageOf(() => assert.doesNotMatch("abc", /b/))));
console.log(JSON.stringify(messageOf(() => assert.match("quo'te", /zzz/))));
console.log("done");
