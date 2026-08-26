// Promise.race over an array literal: first-settle wins, losers keep
// running (their side effects still happen), heterogeneous entries meet
// in the checker's combined union.
function later<T>(v: T, ms: number, tag: string): Promise<T> {
  return new Promise<T>((resolve) =>
    setTimeout(() => {
      console.log("settle:", tag);
      resolve(v);
    }, ms),
  );
}
async function failLater(msg: string, ms: number): Promise<string> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
  throw new Error(msg);
}

async function main(): Promise<void> {
  // homogeneous: the fastest value wins
  const fast = await Promise.race([later("slow", 300, "slow-1"), later("fast", 5, "fast-1")]);
  console.log("won:", fast);
  // heterogeneous: string vs number → string | number
  const mixed = await Promise.race([later("s", 300, "s-2"), later(42, 5, "n-2")]);
  if (mixed === 42) console.log("mixed:", mixed + 1);
  // an already-settled entry wins immediately
  const settled = new Promise<string>((resolve) => resolve("now"));
  const s = await Promise.race([later("late", 300, "late-3"), settled]);
  console.log("settled-entry:", s);
  // a rejection wins the race and arrives catchably
  try {
    await Promise.race([later("ok", 300, "ok-4"), failLater("boom", 1)]);
  } catch (e) {
    if (e instanceof Error) console.log("raced-rejection:", e.message);
  }
  // a real CLI's readStdin shape: data | null vs the "timeout" literal
  const data = new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 300));
  const first = await Promise.race([
    data,
    new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), 5)),
  ]);
  console.log("first:", first === "timeout" ? "timed-out" : "data");
}
main();
console.log("top");
