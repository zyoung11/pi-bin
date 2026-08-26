// The generated scalar messages, byte-for-byte against Node's
// assertion_error.js: the short `a !== b` form under the 12-character
// budget (string quotes excluded), the stacked `+ actual - expected`
// diff above it, the `^` first-difference indicator for string pairs,
// the ±0 special case, escaped quoting, and the not-equal operators'
// inline-vs-block split at 5 inspected characters.
import assert from "node:assert";

function messageOf(f: () => void): string {
  try {
    f();
    return "DID NOT THROW";
  } catch (e) {
    return e instanceof Error ? e.message : "not an Error";
  }
}

// Short form: combined String() lengths up to 12.
console.log(JSON.stringify(messageOf(() => assert.strictEqual(1, 2))));
console.log(JSON.stringify(messageOf(() => assert.strictEqual(111111, 222222))));
console.log(JSON.stringify(messageOf(() => assert.strictEqual("aaaaaa", "bbbbbb"))));
console.log(JSON.stringify(messageOf(() => assert.strictEqual(true, false))));
// Diff form: one character over the budget.
console.log(JSON.stringify(messageOf(() => assert.strictEqual(1111111, 2222222))));
console.log(JSON.stringify(messageOf(() => assert.strictEqual("aaaaaaa", "bbbbbbb"))));
// The string indicator points at the first differing character.
console.log(JSON.stringify(messageOf(() => assert.strictEqual("abcdefgh", "abcdefxy"))));
// A shared prefix shorter than the indicator threshold prints no caret.
console.log(JSON.stringify(messageOf(() => assert.strictEqual("XeeeeeeY", "ZeeeeeeW"))));
// ±0: never the short form, inspect renders the sign.
console.log(JSON.stringify(messageOf(() => assert.strictEqual(0, -0))));
console.log(JSON.stringify(messageOf(() => assert.strictEqual(-0, 5))));
// Escapes stay single-line (quotes excluded from the budget).
console.log(JSON.stringify(messageOf(() => assert.strictEqual("a\nb", "c"))));
// Not-equal: inline up to 5 inspected characters, block above.
console.log(JSON.stringify(messageOf(() => assert.notStrictEqual(7, 7))));
console.log(JSON.stringify(messageOf(() => assert.notStrictEqual(12345, 12345))));
console.log(JSON.stringify(messageOf(() => assert.notStrictEqual("xyz", "xyz"))));
console.log(JSON.stringify(messageOf(() => assert.notStrictEqual("wxyz", "wxyz"))));
console.log(JSON.stringify(messageOf(() => assert.notStrictEqual(true, true))));
// deepStrictEqual over scalars: the deep header, same forms.
console.log(JSON.stringify(messageOf(() => assert.deepStrictEqual(1, 2))));
console.log(JSON.stringify(messageOf(() => assert.deepStrictEqual("a", "bcd"))));
console.log(JSON.stringify(messageOf(() => assert.deepStrictEqual(0, -0))));
console.log(JSON.stringify(messageOf(() => assert.notDeepStrictEqual(12345, 12345))));
console.log(JSON.stringify(messageOf(() => assert.notDeepStrictEqual("wxyz", "wxyz"))));
console.log("done");
