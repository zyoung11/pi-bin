// Async functions returning record literals: the return position's
// contextual type is `T | PromiseLike<T>` (the lib's await-unwrapping
// contract) — the literal still builds as its own record shape and flows
// into the body's return slot, fulfilling the promise with it.
interface Res {
  total: number;
  failed: number;
}

interface Wrapped {
  tag: string;
  inner: Res;
}

async function make(fail: number): Promise<Res> {
  return { total: 3, failed: fail };
}

async function wrap(tag: string): Promise<Wrapped> {
  return { tag, inner: await make(1) };
}

// A union inner: the literal wraps into the promise's union arm.
async function maybeRes(want: boolean): Promise<Res | null> {
  if (!want) return null;
  return { total: 9, failed: 0 };
}

async function main(): Promise<void> {
  const r = await make(1);
  console.log(`make: ${r.total} ${r.failed}`);
  const { total, failed } = await make(2);
  console.log(`destructured: ${total} ${failed}`);
  const w = await wrap("w1");
  console.log(`wrapped: ${w.tag} ${w.inner.total} ${w.inner.failed}`);
  const yes = await maybeRes(true);
  const no = await maybeRes(false);
  console.log(`maybe: ${yes ? yes.total : -1} ${no ? no.total : -1}`);
}

main();
