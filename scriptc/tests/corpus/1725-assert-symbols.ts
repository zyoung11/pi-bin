// assert.strictEqual / notStrictEqual / the deep twins over symbols:
// pointer identity (every Symbol() is distinct; Symbol.for interns per
// key), with v24's "Symbol(desc)" messages — the stacked diff carries
// the string-style `^` first-difference indicator, equal renderings of
// distinct symbols print the +/- pair without one, and the not-equal
// forms take the block layout (a symbol rendering is never <= 5 chars).
import assert from "node:assert";

function messageOf(f: () => void): string {
  try {
    f();
    return "NO THROW";
  } catch (e) {
    return e instanceof Error ? `${e.name}|${e.message}` : "not an Error";
  }
}

const a = Symbol("a");
const b = Symbol("b");
const a2 = Symbol("a");
assert.strictEqual(a, a);
assert.notStrictEqual(a, b);
assert.notStrictEqual(a, a2);
assert.strictEqual(Symbol.for("k"), Symbol.for("k"));
assert.deepStrictEqual(a, a);
assert.notDeepStrictEqual(a, a2);
console.log("symbol pass ok");
console.log("A ", JSON.stringify(messageOf(() => assert.strictEqual(a, b))));
console.log("B ", JSON.stringify(messageOf(() => assert.strictEqual(a, a2))));
console.log("C ", JSON.stringify(messageOf(() => assert.strictEqual(Symbol(), Symbol()))));
console.log("D ", JSON.stringify(messageOf(() => assert.notStrictEqual(a, a))));
console.log("E ", JSON.stringify(messageOf(() => assert.notStrictEqual(Symbol.for("k"), Symbol.for("k")))));
console.log("F ", JSON.stringify(messageOf(() => assert.strictEqual(a, b, "custom"))));
console.log("G ", JSON.stringify(messageOf(() => assert.strictEqual(Symbol("long description here"), Symbol("other long description")))));
console.log("H ", JSON.stringify(messageOf(() => assert.deepStrictEqual(a, b))));
console.log("done");
