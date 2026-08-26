// node:assert over function values and function-element arrays: deep
// equality over functions is reference identity (Node compares them as
// opaque objects), strictEqual/notStrictEqual take the object-comparison
// headers, and a context-free empty [] adopts the other side's array
// type.
import assert from "node:assert";

function f(): void {}
function g(): void {}
const alias = f;

assert.strictEqual(f, alias);
assert.notStrictEqual(f, g);
assert.deepStrictEqual(f, alias);
assert.notDeepStrictEqual(f, g);
assert.deepStrictEqual([f, g], [f, g]);
assert.notDeepStrictEqual([f, g], [g, f]);
assert.deepStrictEqual([] as (() => void)[], []);
console.log("verdicts ok");

const firstLine = (fn: () => void): void => {
  try {
    fn();
    console.log("no throw");
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.name, `${(e as NodeJS.ErrnoException).code}`, e.message.split("\n")[0] as string);
    }
  }
};
firstLine(() => assert.strictEqual(f, g));
firstLine(() => assert.notStrictEqual(f, alias));
firstLine(() => assert.deepStrictEqual([f], [g]));
firstLine(() => assert.notDeepStrictEqual([f], [alias]));
console.log("done");
