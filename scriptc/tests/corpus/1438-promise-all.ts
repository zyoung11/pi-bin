// Promise.all over Promise<T>[] arrays (promise-element arrays are real
// values now): result order matches INPUT order regardless of settlement
// order, the first rejection in settlement order wins while later ones
// stay handled, the empty array resolves immediately, already-settled
// entries settle inline, and void entries collapse to Promise<void>.
function later<T>(v: T, ms: number, tag: string): Promise<T> {
  return new Promise<T>((resolve) =>
    setTimeout(() => {
      console.log("settle:", tag);
      resolve(v);
    }, ms),
  );
}
async function failAfter(msg: string, ms: number): Promise<number> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
  throw new Error(msg);
}
async function loadLen(s: string): Promise<number> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), s.length));
  return s.length;
}

async function main(): Promise<void> {
  // out-of-order settlement, in-order results (interleaved logs prove it)
  const ps: Promise<number>[] = [later(1, 400, "a"), later(2, 5, "b"), later(3, 150, "c")];
  const got = await Promise.all(ps);
  console.log("all:", got.join(","));

  // promise-element arrays are ordinary arrays: store, read back, await
  const held: Promise<string>[] = [];
  held.push(later("x", 150, "x"));
  held.push(later("y", 5, "y"));
  console.log("held:", held.length);
  const first = await held[0];
  console.log("first:", first);
  const rest = await Promise.all(held);
  console.log("rest:", rest.join("+"));

  // the .map shape: an array of promises minted by a HOF
  const words = ["one", "three", "am"];
  const lens = await Promise.all(words.map((w) => loadLen(w)));
  console.log("lens:", lens.join(","));

  // first rejection in SETTLEMENT order wins; the slower rejection stays
  // handled (no unhandled-rejection report at exit)
  const mixed: Promise<number>[] = [
    failAfter("slow-boom", 150),
    later(7, 400, "survivor"),
    failAfter("fast-boom", 5),
  ];
  try {
    await Promise.all(mixed);
    console.log("mixed: resolved");
  } catch (e) {
    if (e instanceof Error) console.log("mixed:", e.message);
  }

  // empty array resolves immediately (one microtask hop)
  const none: Promise<number>[] = [];
  const empty = await Promise.all(none);
  console.log("empty:", empty.length);

  // already-settled entries settle inline
  const settled: Promise<string>[] = [
    new Promise<string>((resolve) => resolve("now1")),
    new Promise<string>((resolve) => resolve("now2")),
  ];
  console.log("settled:", (await Promise.all(settled)).join("&"));

  // Promise<void> entries: await-and-discard is the supported shape
  const voids: Promise<void>[] = [
    new Promise<void>((resolve) => setTimeout(() => resolve(), 10)),
    new Promise<void>((resolve) => setTimeout(() => resolve(), 2)),
  ];
  await Promise.all(voids);
  console.log("voids: done");

  // side effects of losers still happen after the rejection won
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 400));
  console.log("end");
}
main();
console.log("top");
