// assert.doesNotReject: fulfillment passes; a rejection MATCHING the
// expectation (or with none) throws "Got unwanted rejection" with the
// actual message quoted; a NON-matching rejection rethrows the original
// reason untouched. A string expectation is the message form; regex
// expectations test String(error).
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
  await assert.doesNotReject(fulfilled);
  await assert.doesNotReject(fulfilled, RangeError);
  await assert.doesNotReject(fulfilled, /anything/);
  console.log("dnr pass ok");
  console.log("A ", JSON.stringify(await amsg(() => assert.doesNotReject(rejecting))));
  console.log("B ", JSON.stringify(await amsg(() => assert.doesNotReject(rejecting, TypeError))));
  console.log("C ", JSON.stringify(await amsg(() => assert.doesNotReject(rejecting, RangeError))));
  console.log("D ", JSON.stringify(await amsg(() => assert.doesNotReject(rejecting, RangeError, "note"))));
  console.log("E ", JSON.stringify(await amsg(() => assert.doesNotReject(rejecting, /RangeError: boom/))));
  console.log("F ", JSON.stringify(await amsg(() => assert.doesNotReject(rejecting, /city/))));
  console.log("G ", JSON.stringify(await amsg(() => assert.doesNotReject(rejecting, "note"))));
  console.log("done");
}
void main();
