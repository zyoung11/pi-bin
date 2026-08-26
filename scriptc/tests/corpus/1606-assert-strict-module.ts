// node:assert/strict — the loose NAMES bound to the strict comparisons
// (equal IS strictEqual, deepEqual IS deepStrictEqual, Node's aliasing),
// as a callable default import, through assert.strict, and with the
// strict messages ("Expected values to be strictly equal:" — never the
// loose wording).
import strict from "node:assert/strict";
import assert from "node:assert";

strict(1 < 2);
strict.ok("via strict module");
strict.equal(4, 4);
strict.notEqual(4, 5);
strict.deepEqual([1, [2]], [1, [2]]);
strict.notDeepEqual([1], [2]);
strict.strictEqual("also", "also");
strict.deepStrictEqual({ n: 1 }, { n: 1 });
strict.match("abc", /b/);
console.log("strict module ok");

// assert.strict is the same module object.
assert.strict.equal(7, 7);
assert.strict.notDeepEqual([true], [false]);
console.log("assert.strict ok");

function messageOf(f: () => void): string {
  try {
    f();
    return "DID NOT THROW";
  } catch (e) {
    return e instanceof Error ? `${e.name}: ${e.message}` : "not an Error";
  }
}
// strict.equal fails with strictEqual's message, not =='s.
console.log(JSON.stringify(messageOf(() => strict.equal(1, 2))));
console.log(JSON.stringify(messageOf(() => strict.notEqual("s", "s"))));
console.log(JSON.stringify(messageOf(() => assert.strict.equal("p", "q"))));
console.log(JSON.stringify(messageOf(() => strict.fail("strict failure"))));
console.log("done");
