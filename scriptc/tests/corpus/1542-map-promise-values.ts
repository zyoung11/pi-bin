// Map<string, Promise<T>> — the in-flight dedupe idiom (portless's SNI
// pending map): store a running promise under its key, answer the SAME
// promise to concurrent askers (one computation), and delete on settle.
// Promises are ordinary refcounted map values; a settled promise has
// dropped its reactions, so the map holds plain handles.
let computations = 0;
async function compute(key: string): Promise<string> {
  computations = computations + 1;
  await new Promise<number>((resolve) => resolve(0));
  return key.toUpperCase();
}

const pending = new Map<string, Promise<string>>();

function lookup(key: string): Promise<string> {
  const inFlight = pending.get(key);
  if (inFlight !== undefined) return inFlight;
  const p = compute(key);
  pending.set(key, p);
  return p;
}

async function main(): Promise<void> {
  // Two concurrent lookups of the same key share one computation.
  const a = lookup("alpha");
  const b = lookup("alpha");
  const c = lookup("beta");
  console.log(pending.size, pending.has("alpha"), pending.has("beta"), pending.has("gamma"));
  console.log(await a, await b, await c);
  console.log("computations", computations);
  // Settled entries clear; the delete answers presence like any map.
  console.log(pending.delete("alpha"), pending.delete("alpha"), pending.delete("beta"));
  console.log(pending.size);
  // Re-lookup after clearing recomputes.
  console.log(await lookup("alpha"), computations);
}
main();
