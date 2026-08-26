// assert.throws(fn, { name/code/message }) — Node's expectedException
// over the static error surface: string keys compare deep-strict, regex
// values test the actual string, and the generated failure message is
// the deep-equal Comparison diff BYTE-EXACTLY (keys in inspect's sorted
// order, matched regex values rendering as the actual's own value, the
// absent-code deletions, the +/- gap grouping). The runtime `code` slot
// is the comparison's code source (fs/exec/assert stamp it).
import assert from "node:assert";
import { readFileSync } from "node:fs";

function messageOf(f: () => void): string {
  try {
    f();
    return "NO THROW";
  } catch (e) {
    return e instanceof Error ? e.message : "not an Error";
  }
}

// Passing shapes: single key, multiple keys, regex values.
assert.throws(() => { throw new TypeError("boom"); }, { name: "TypeError" });
assert.throws(() => { throw new TypeError("boom"); }, { name: "TypeError", message: "boom" });
assert.throws(() => { throw new TypeError("boom town"); }, { name: "TypeError", message: /town/ });
assert.throws(() => { throw new RangeError("boom"); }, { name: /Range/ });
console.log("shape pass ok");

// Single-key mismatch.
console.log("A ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("boom"); }, { name: "TypeError" }))));
// Message mismatch alongside a matching name.
console.log("B ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("boom"); }, { name: "RangeError", message: "zap" }))));
// Regex value that did NOT match renders as the regex.
console.log("C ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("boom"); }, { name: /Type/ }))));
// Absent code: the pure deletion and the zero-key "Comparison {}" forms.
console.log("D ", JSON.stringify(messageOf(() => assert.throws(() => { throw new TypeError("boom"); }, { code: "ERR_X" }))));
console.log("E ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("boom"); }, { name: "RangeError", code: "ERR_X", message: "boom" }))));
console.log("F ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("boom"); }, { code: "ERR_X", name: "TypeError" }))));
console.log("G ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("boom"); }, { code: "ERR_X", message: "zap", name: "TypeError" }))));
// Empty and multiline messages, quoting.
console.log("H ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError(); }, { message: "x" }))));
console.log("I ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("line1\nline2"); }, { message: "line1\nother" }))));
console.log("J ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("it's here"); }, { message: "other" }))));

// Runtime code slots: fs errno errors and assert's own ERR_ASSERTION.
const missing = "/nonexistent-scriptc-assert-corpus-path";
assert.throws(() => { readFileSync(missing, "utf8"); }, { code: "ENOENT" });
assert.throws(() => { assert.ok(false); }, { code: "ERR_ASSERTION", name: "AssertionError" });
console.log("K ", JSON.stringify(messageOf(() => assert.throws(() => { readFileSync(missing, "utf8"); }, { code: "EACCES" }))));
console.log("L ", JSON.stringify(messageOf(() => assert.throws(() => { readFileSync(missing, "utf8"); }, { name: "Error", code: "EACCES" }))));
// Matched regex values render as the actual value on BOTH sides.
console.log("M ", JSON.stringify(messageOf(() => assert.throws(() => { readFileSync(missing, "utf8"); }, { message: /no such file/, code: "EACCES" }))));

// The 3-arg form: a custom message stands alone on any mismatch.
console.log("N ", JSON.stringify(messageOf(() => assert.throws(() => { throw new RangeError("boom"); }, { name: "TypeError" }, "custom msg"))));
// Missing exception: the ` (${expected.name})` detail — string and
// regex-literal name values, and the message tail.
console.log("O ", JSON.stringify(messageOf(() => assert.throws(() => {}, { name: "TypeError" }))));
console.log("P ", JSON.stringify(messageOf(() => assert.throws(() => {}, { name: /Type/ }))));
console.log("Q ", JSON.stringify(messageOf(() => assert.throws(() => {}, { name: "TypeError" }, "custom msg"))));
console.log("R ", JSON.stringify(messageOf(() => assert.throws(() => {}, { code: "ERR_X" }))));
console.log("done");
