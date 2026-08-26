// assert.throws's regex and 3-arg class forms: a regex second argument
// tests String(error) ("Name: message"), the mismatch message inspects
// that string; the class form's missing-exception message carries the
// ` (${expected.name})` detail; a custom third argument replaces the
// generated text on every failure path.
import assert from "node:assert";

class AppError extends Error {}

function messageOf(f: () => void): string {
  try {
    f();
    return "NO THROW";
  } catch (e) {
    return e instanceof Error ? e.message : "not an Error";
  }
}

// Regex form: passes against String(error), flags render in getter order.
assert.throws(() => { throw new RangeError("boom"); }, /RangeError: boom/);
assert.throws(() => { throw new RangeError("boom"); }, /BOOM/i);
assert.throws(() => { throw new AppError("app trouble"); }, /trouble/);
console.log("regex pass ok");
console.log("A ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("boom"); }, /city/))));
console.log("B ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("it's here"); }, /nope/im))));
// Regex form with a custom message.
console.log("C ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("x"); }, /nope/, "custom"))));
// Missing exception under a regex expectation: no name detail.
console.log("D ", JSON.stringify(messageOf(() => assert.throws(() => {}, /x/))));
// Class form: the (Name) detail on missing exception, the 3-arg custom
// message on both failure paths.
console.log("E ", JSON.stringify(messageOf(() => assert.throws(() => {}, TypeError))));
console.log("F ", JSON.stringify(messageOf(() => assert.throws(() => {}, AppError))));
console.log("G ", JSON.stringify(messageOf(() => assert.throws(() => {}, TypeError, "custom msg"))));
console.log("H ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("x"); }, TypeError, "custom"))));
console.log("I ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("out of range"); }, TypeError))));
// A literal `undefined` expected counts as omitted — the message reads
// from the THIRD argument (Node's error == null spelling).
assert.throws(() => { throw new RangeError("x"); }, undefined, "unused");
console.log("J ", JSON.stringify(messageOf(() => assert.throws(() => {}, undefined, "third-arg message"))));
console.log("done");
