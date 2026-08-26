// Promise.reject: a pre-rejected promise whose Error reason rethrows at the
// await, catch-side instanceof answers, and the result type comes from the
// POSITION (the declared return type — the ngrok spawn-failure shape).
function failEarly(ok: boolean): Promise<string> {
  if (!ok) {
    return Promise.reject(new Error("spawn failed: ENOENT"));
  }
  return new Promise((resolve) => resolve("started"));
}

async function main(): Promise<void> {
  console.log(await failEarly(true));
  try {
    await failEarly(false);
    console.log("unreachable");
  } catch (e) {
    console.log("caught:", e instanceof Error ? e.message : "?");
    console.log("is TypeError:", e instanceof TypeError);
  }

  // A rejected promise observed through .catch instead of await.
  const seen = await failEarly(false).catch((e) =>
    e instanceof Error ? `handled: ${e.message}` : "handled: ?",
  );
  console.log(seen);

  // Promise.all over a homogeneous two-entry LITERAL: the checker's tuple
  // overload types it [Promise<T>, Promise<T>], and the countdown
  // combinator still fills per input index (the certs read-both-files
  // shape, destructured).
  const slow = new Promise<string>((resolve) => setTimeout(() => resolve("slow"), 20));
  const fast = new Promise<string>((resolve) => setTimeout(() => resolve("fast"), 5));
  const [a, b] = await Promise.all([slow, fast]);
  console.log("order-stable:", a, b);

  // Number inners take the value-array store path too.
  const [x, y, z] = await Promise.all([
    new Promise<number>((resolve) => resolve(1)),
    new Promise<number>((resolve) => resolve(2)),
    new Promise<number>((resolve) => resolve(3)),
  ]);
  console.log("sum:", x + y + z);

  // First rejection wins across a homogeneous literal.
  const bad = failEarly(false);
  const good = failEarly(true);
  try {
    await Promise.all([good, bad]);
    console.log("unreachable");
  } catch (e) {
    console.log("all rejects:", e instanceof Error ? e.message : "?");
  }
}

void main();
