// Promise.try (ES2025): the callback runs SYNCHRONOUSLY, a plain result
// fulfills (one tick after the competing microtask chain starts — pinned
// below), a returned promise is adopted, and a synchronous throw becomes
// a catchable rejection instead of unwinding the caller.
async function main(): Promise<void> {
  const order: string[] = [];
  const p1 = Promise.try(() => { order.push("ran"); return 6 * 7; });
  order.push("after");
  console.log(await p1, order.join(","));
  const p2 = Promise.try((): number => { throw new Error("boom"); });
  order.push("no-unwind");
  try {
    await p2;
    console.log("unreachable");
  } catch (e) {
    console.log("caught", (e as Error).message, order.join(","));
  }
  const p3 = Promise.try(async () => { return "adopted"; });
  console.log(await p3);
  const p4 = Promise.try(() => { order.push("void-ran"); });
  await p4;
  console.log(order.join(","));
  // Plain-result settlement tick, raced against a .then chain.
  const ticks: string[] = [];
  const p5 = Promise.try(() => "v");
  void Promise.resolve(1).then(() => { ticks.push("t1"); return 1; }).then(() => { ticks.push("t2"); return 1; }).then(() => { ticks.push("t3"); return 1; });
  void p5.then((v) => { ticks.push("settled:" + v); return v; });
  await new Promise<void>((r) => setTimeout(r, 5));
  console.log(ticks.join(","));
  // Results chain like any promise; rejection from an adopted async throw.
  const p6 = Promise.try(async (): Promise<string> => { throw new Error("late"); });
  try {
    await p6;
  } catch (e) {
    console.log("late-caught", (e as Error).message);
  }
  const chained: string = await Promise.try(() => "s").then((s) => s.toUpperCase());
  console.log(chained);
}
void main();
