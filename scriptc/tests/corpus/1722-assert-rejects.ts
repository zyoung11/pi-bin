// assert.rejects — the async assert.throws: an async callback or a
// promise first argument, the bare/class/shape/regex/message expected
// forms, "Missing expected rejection" with the (Name) detail, and the
// same mismatch messages as throws. A synchronous throw from the
// callback propagates RAW (Node's waitForActual), and the whole call is
// awaited like Node's.
import assert from "node:assert";

async function amsg(f: () => Promise<void>): Promise<string> {
  try {
    await f();
    return "NO REJECT";
  } catch (e) {
    return e instanceof Error ? `${e.name}|${e.message}` : "not an Error";
  }
}

const rejecting = async (): Promise<void> => { throw new RangeError("boom"); };
const fulfilled = async (): Promise<void> => {};

async function main(): Promise<void> {
  await assert.rejects(rejecting);
  await assert.rejects(rejecting, RangeError);
  await assert.rejects(rejecting, Error);
  await assert.rejects(rejecting, { name: "RangeError", message: "boom" });
  await assert.rejects(rejecting, { message: /oo/ });
  await assert.rejects(rejecting, /RangeError: boom/);
  console.log("rejects pass ok");
  const rp: Promise<void> = Promise.reject(new RangeError("p"));
  await assert.rejects(rp, RangeError);
  console.log("promise arg ok");
  console.log("A ", JSON.stringify(await amsg(() => assert.rejects(fulfilled))));
  console.log("B ", JSON.stringify(await amsg(() => assert.rejects(fulfilled, TypeError))));
  console.log("C ", JSON.stringify(await amsg(() => assert.rejects(fulfilled, { name: "TypeError" }, "oops"))));
  console.log("D ", JSON.stringify(await amsg(() => assert.rejects(rejecting, TypeError))));
  console.log("E ", JSON.stringify(await amsg(() => assert.rejects(rejecting, { name: "TypeError" }))));
  console.log("F ", JSON.stringify(await amsg(() => assert.rejects(rejecting, /city/))));
  console.log("G ", JSON.stringify(await amsg(() => assert.rejects(fulfilled, "custom"))));
  // A sync throw from a promise-returning (non-async) callback: the raw
  // error, not an AssertionError.
  console.log("H ", JSON.stringify(await amsg(() => assert.rejects((): Promise<void> => { throw new TypeError("sync"); }, RangeError))));
  console.log("done");
}
void main();
