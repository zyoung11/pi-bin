// assert inside async functions: a failing assertion REJECTS through the
// await chain and catches like any thrown error; passing ones fall
// through across suspension points; assert.throws callbacks capture
// enclosing state.
import assert from "node:assert";

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 1));

async function checked(n: number): Promise<number> {
  await tick();
  assert.ok(n % 2 === 0, `odd input: ${n}`);
  await tick();
  assert.strictEqual(n >= 0, true, "negative input");
  return n / 2;
}

async function main(): Promise<void> {
  assert.strictEqual(await checked(10), 5);
  console.log("even path ok");
  try {
    await checked(7);
  } catch (e) {
    if (e instanceof Error) console.log("caught:", e.name, "-", e.message);
  }
  try {
    await checked(-2);
  } catch (e) {
    if (e instanceof Error) console.log("caught:", e.message);
  }
  let seen = "";
  assert.throws(() => {
    seen = "callback ran";
    throw new RangeError("captured");
  }, RangeError);
  assert.strictEqual(seen, "callback ran");
  assert.deepStrictEqual([await checked(4), await checked(8)], [2, 4]);
  console.log("async done");
}
void main();
