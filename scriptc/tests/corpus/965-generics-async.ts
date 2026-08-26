// Generic ASYNC functions: monomorphization composes with the fiber
// machinery — each instantiation gets its own spawn wrapper, awaits park
// per fiber, and the eager synchronous prefix runs per call, exactly like
// a non-generic async function of the substituted signature.
async function hop(): Promise<void> {}

async function echo<T>(tag: string, value: T): Promise<T> {
  console.log(`${tag}: start`);
  await hop();
  console.log(`${tag}: end`);
  return value;
}

// A generic async calling another generic async, with awaits in a loop.
async function collect<T>(tag: string, items: T[]): Promise<T[]> {
  const out: T[] = [];
  for (const item of items) {
    out.push(await echo(`${tag}[${out.length}]`, item));
  }
  return out;
}

// Recursion within one instantiation.
async function countdown<T>(label: T, n: number): Promise<number> {
  if (n <= 0) return 0;
  await hop();
  console.log(`countdown ${label} ${n}`);
  return (await countdown(label, n - 1)) + n;
}

// The worker-pool shape (pMap's skeleton): a nested async function
// captures the generic-typed inputs and a shared mutable cursor; several
// workers interleave over their awaits.
async function mapPool<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const done = new Map<number, R>();
  let nextIdx = 0;
  async function worker(): Promise<void> {
    while (nextIdx < items.length) {
      const idx = nextIdx;
      nextIdx = nextIdx + 1;
      done.set(idx, await fn(items[idx], idx));
    }
  }
  // Up to two workers (promise ARRAYS stay unsupported); the second rides
  // a promise-or-absent union, awaited through the union-aware await.
  const w1 = worker();
  const w2: Promise<void> | undefined =
    concurrency > 1 && items.length > 1 ? worker() : undefined;
  await w1;
  await w2;
  const results: R[] = [];
  for (let i = 0; i < items.length; i++) {
    const r = done.get(i);
    if (r !== undefined) results.push(r);
  }
  return results;
}

interface Item {
  id: number;
  name: string;
}

async function main(): Promise<void> {
  const num = await echo("num", 41);
  const str = await echo("str", "forty-one");
  console.log(`echoed ${num + 1} ${str}`);

  const recs = await collect("rec", [
    { id: 1, name: "a" },
    { id: 2, name: "b" },
  ]);
  console.log(`collected ${recs.length}: ${recs[0].name}${recs[1].name}`);

  console.log(`countdown sum: ${await countdown("x", 3)}`);

  const doubled = await mapPool(
    [10, 20, 30, 40, 50],
    async (v, i) => {
      console.log(`work ${i} on ${v}`);
      await hop();
      return v * 2;
    },
    2
  );
  console.log(`doubled: ${doubled.join(",")}`);

  const named = await mapPool(
    [
      { id: 7, name: "seven" },
      { id: 8, name: "eight" },
    ],
    async (item, i) => {
      await hop();
      return `${i}:${item.name}(${item.id})`;
    },
    3
  );
  console.log(`named: ${named.join(" ")}`);
}

main();
