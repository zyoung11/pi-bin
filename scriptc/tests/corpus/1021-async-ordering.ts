// Microtasks (awaited resolutions) run before timers; equal-deadline timers
// fire in registration order. Order-only assertions (no wall-time).
function tick(tag: string, ms: number): Promise<string> {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      console.log("timer", tag);
      resolve(tag);
    }, ms);
  });
}
async function chain(): Promise<void> {
  const a = await tick("a-10", 10);
  console.log("after", a);
  const b = await tick("b-5", 5);
  console.log("after", b);
}
setTimeout(() => {
  console.log("t0-first");
}, 0);
setTimeout(() => {
  console.log("t0-second");
}, 0);
chain();
console.log("sync tail");
