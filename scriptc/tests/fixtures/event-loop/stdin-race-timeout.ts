// The a real CLI race shape: first chunk vs a timeout, destroy() on timeout
// so the loop stops waiting on a silent-but-open pipe and the program
// exits promptly. An interval spins alongside to prove timers keep
// firing while stdin is watched — but the spin count is only
// deterministic when the TIMEOUT wins (250ms >> the 20ms period, the
// bounded-margin rule); when data/EOF arrives instantly, whether the
// first tick beat it is a pure race on BOTH sides, so those paths must
// not print spinner state.
let spins = 0;
const spinner = setInterval(() => {
  spins++;
}, 20);

async function readFirst(): Promise<string> {
  const first = await Promise.race([
    new Promise<string>((resolve) => {
      process.stdin.once("data", (chunk) => resolve(`data:${chunk.length}`));
      process.stdin.once("end", () => resolve("end"));
      process.stdin.once("error", () => resolve("error"));
    }),
    new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), 250)),
  ]);
  if (first === "timeout") {
    process.stdin.destroy();
    return "timed out";
  }
  return first;
}

async function main(): Promise<void> {
  const result = await readFirst();
  clearInterval(spinner);
  console.log(result);
  if (result === "timed out") {
    console.log("spun", spins > 0);
  }
}
main();
