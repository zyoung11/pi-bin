// node:timers/promises — the promisified pair: setTimeout(delay?) and
// setImmediate() resolve void promises. Sequential awaits, the elapsed-time
// floor (a 30ms sleep takes at least ~30ms), interleaving with the callback
// timer surface, and both import spellings (named + namespace member).
import { setTimeout as sleep, setImmediate as tick } from "node:timers/promises";
import * as tp from "timers/promises";

async function main(): Promise<void> {
  console.log("start");
  const t0 = Date.now();
  await sleep(30);
  const elapsed = Date.now() - t0;
  console.log(elapsed >= 25 ? "slept" : `too fast: ${elapsed}`);

  // The bare forms: an omitted delay is Node's 1ms floor; setImmediate
  // resolves on the check phase of the current turn.
  await sleep();
  console.log("default delay");
  await tick();
  console.log("immediate");

  // The namespace spelling rides the same lowering.
  await tp.setTimeout(1);
  console.log("namespace");

  // An armed promise-timer interleaves with the callback surface: the
  // 5ms callback fires while the 40ms sleep is pending.
  const order: string[] = [];
  setTimeout(() => {
    order.push("callback");
  }, 5);
  await tp.setTimeout(40);
  order.push("sleep");
  console.log(order.join(","));
}

main().then(() => {
  console.log("done");
});
