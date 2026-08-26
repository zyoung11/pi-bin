// Optional/default/rest parameters on async functions (the completed args
// ride the spawn argpack; defaults evaluate in the synchronous prefix) and
// on generic functions (each instantiation completes against its resolved
// signature).
async function delayEcho(msg: string, extra?: string): Promise<string> {
  const p = new Promise<number>((resolve) => {
    setTimeout(() => resolve(1), 0);
  });
  await p;
  if (extra === undefined) return msg;
  return msg + "+" + extra;
}

async function defaulted(base: number, add: number = base * 10): Promise<number> {
  console.log("prefix sees " + add);
  const p = new Promise<number>((resolve) => {
    setTimeout(() => resolve(base + add), 0);
  });
  const v = await p;
  return v + add;
}

async function restSum(...xs: number[]): Promise<number> {
  let total = 0;
  for (const x of xs) {
    const step = x;
    const p = new Promise<number>((resolve) => {
      setTimeout(() => resolve(step), 0);
    });
    total += await p;
  }
  return total;
}

async function main(): Promise<void> {
  console.log(await delayEcho("solo"));
  console.log(await delayEcho("duo", "b"));
  console.log(await delayEcho("tri", undefined));
  console.log(await defaulted(3));
  console.log(await defaulted(3, 1));
  console.log(await restSum());
  console.log(await restSum(1, 2, 3));
}

// Generic functions: rest of T, optional T, defaults mentioning T-typed
// earlier params — completed per instantiation.
function firstOr<T>(fallback: T, ...xs: T[]): T {
  return xs.length > 0 ? xs[0] : fallback;
}
console.log(firstOr(0));
console.log(firstOr(0, 5, 6));
console.log(firstOr("none", "a", "b"));

function maybeLen<T>(x: T, tail?: T): number {
  return tail === undefined ? 1 : 2;
}
console.log(maybeLen(1), maybeLen(1, 2), maybeLen("a", "b"));

function dup<T>(x: T, times: number = 2): T[] {
  const out: T[] = [];
  for (let i = 0; i < times; i++) out.push(x);
  return out;
}
console.log(dup(7).length, dup(7, 4).length, dup("s").length);

main();
