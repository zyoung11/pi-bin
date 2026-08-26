// The island → static promise bridge, happy and rejecting paths — the
// cases the old promise-chain fence pinned as compile errors, flipped to
// behavior and byte-compared against Node. A package call's promise lives
// in the ENGINE; awaiting it parks the fiber until the engine promise
// settles, rejections cross like bridged exceptions (engine Errors arrive
// as real instances — instanceof narrows), and .catch/.finally desugar
// over the bridged promise like over any static one.
import { defer, deferChain, deferFail, deferFailValue, done, tag } from "defer";

async function run(): Promise<void> {
  // Already-settled engine promise: the settled-await microtask hop. The
  // awaited value is an island handle; the number-typed local is the
  // validated exit.
  const v: number = await defer(21);
  console.log(v);
  // Settles after an engine microtask chain: the awaiter really parks.
  const chained: number = await deferChain(3);
  console.log(chained);
  // String payload.
  const tagged: string = await tag("s");
  console.log(tagged);
  // Promise<void> fulfillment carries nothing.
  await done();
  console.log("done resolved");
  // An engine TypeError crosses as a real TypeError instance.
  try {
    await deferFail("boom");
  } catch (e) {
    if (e instanceof TypeError) {
      console.log("TypeError: " + e.message);
    } else {
      console.log("not narrowed: " + String(e));
    }
  }
  // A non-Error rejection value stays a plain value.
  try {
    await deferFailValue("plain reason");
  } catch (e) {
    console.log("caught: " + String(e));
  }
  // Double bridge: one engine promise, two independent static observers.
  const p = defer(50);
  const a = await p;
  const b = await p;
  console.log(a + b);
  // .catch over a bridged rejection: the handler's value resolves.
  const fallback = await deferFail("recovered").catch((e) => {
    console.log("handler saw: " + String(e));
    return -1;
  });
  console.log(fallback);
  // .finally runs on fulfillment (value passes through) ...
  const kept = await defer(4).finally(() => {
    console.log("finally after fulfill");
  });
  console.log(kept);
  // ... and on rejection (the rejection keeps propagating).
  try {
    await deferFail("kept").finally(() => {
      console.log("finally after reject");
    });
  } catch (e) {
    console.log("still rejected: " + String(e));
  }
}
run();
console.log("main done");
