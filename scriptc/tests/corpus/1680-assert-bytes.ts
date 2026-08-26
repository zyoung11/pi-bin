// node:assert over typed arrays / Buffers: strictEqual is reference
// identity (Object.is on objects) with Node's object-comparison headers;
// deepStrictEqual compares the BRAND first (Node compares prototypes —
// Buffer vs Uint8Array differ; the brand is the argument's checker type)
// and then the contents. Generated failure messages carry the header line
// (the composite stance — the rendered diff needs the assert diff
// engine).
import assert from "node:assert";

const a = Buffer.from([1, 2, 3]);
const b = Buffer.from([1, 2, 3]);
const c = Buffer.from([1, 2, 4]);
const shorter = Buffer.from([1, 2]);

assert.deepStrictEqual(a, b);
assert.notDeepStrictEqual(a, c);
assert.notDeepStrictEqual(a, shorter);
assert.strictEqual(a, a);
assert.notStrictEqual(a, b);

const u = new Uint8Array([1, 2, 3]);
const v = new Uint8Array([1, 2, 3]);
assert.deepStrictEqual(u, v);
assert.notDeepStrictEqual(a, u); // brands differ: Buffer vs Uint8Array
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
firstLine(() => assert.strictEqual(a, b));
firstLine(() => assert.strictEqual(a, c));
firstLine(() => assert.notStrictEqual(a, a));
firstLine(() => assert.deepStrictEqual(a, c));
firstLine(() => assert.deepStrictEqual(a, u));
firstLine(() => assert.notDeepStrictEqual(a, b));
firstLine(() => assert.deepStrictEqual(a, c, "custom words"));
firstLine(() => assert.strictEqual(a, b, "custom words"));

console.log(a === a, a === b);
const empty1 = Buffer.alloc(0);
const empty2 = Buffer.from([]);
assert.deepStrictEqual(empty1, empty2);
console.log("done");
