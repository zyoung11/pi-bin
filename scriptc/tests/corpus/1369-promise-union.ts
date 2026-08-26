// Promise-typed arms in unions — the lazy-init cache idiom: a
// `Promise<R> | null` global, truthiness-tested and reused, so concurrent
// callers share ONE settlement (and one identity).

interface R {
  n: number;
}
let cache: Promise<R> | null = null;
let makes = 0;

async function make(): Promise<R> {
  makes++;
  const v: R = { n: 41 };
  return v;
}

function get(): Promise<R> {
  if (!cache) cache = make();
  return cache;
}

async function main(): Promise<void> {
  const p1 = get();
  const p2 = get();
  console.log(p1 === p2);
  const r1 = await p1;
  const r2 = await p2;
  console.log(r1.n, r2.n, r1 === r2, makes);

  // The union narrows on the unit test too.
  if (cache !== null) {
    const again = await cache;
    console.log(again.n);
  }
}
main();
