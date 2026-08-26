// Promise-typed values captured by closures (boxed) and awaited more than
// once. Regression test: promise capture boxes crashed the emitter.
async function make(base: number): Promise<number> {
  return base + 40;
}

async function run(): Promise<void> {
  const p = make(2);
  const read = async (extra: number): Promise<number> => (await p) + extra;
  const a = await read(1);
  const b = await read(2); // second await on the same captured promise
  console.log(a, b);

  // A boxed promise reassigned through the shared binding.
  let q = make(10);
  const swap = (): void => {
    q = make(20);
  };
  console.log(await q);
  swap();
  console.log(await q);
}

run();
