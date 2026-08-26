// Async cycle: a promise fulfilled with a closure that captures the very
// binding holding that promise — box(p) -> promise -> payload closure ->
// box(p). Awaiting through the cycle first proves it settles normally; the
// sanitized lane asserts the cycle is collected once run() finishes and
// the event loop drains.
async function seed(base: number): Promise<() => number> {
  return (): number => base;
}

async function run(): Promise<void> {
  let p: Promise<() => number> = seed(1);
  const first = await p;
  console.log(first());

  const mk = async (): Promise<() => number> => {
    return (): number => {
      const mine = p; // captures the box holding the promise itself
      return 42;
    };
  };
  p = mk();
  const f = await p;
  console.log(f());
}

run();
