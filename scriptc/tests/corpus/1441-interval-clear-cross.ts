// Two concurrent intervals, cleared from OUTSIDE their own callbacks: a
// timer clears the fast one mid-flight (an entry removed EAGERLY from the
// heap — the loop must not stay alive for its far-future reschedule), the
// slow one clears itself by COUNT, and an async fiber awaiting a
// timer-resolved promise interleaves with the ticks. The wall-clock-raced
// interval's tick count is printed only as a bounded fact (>= 1) so the
// output is stable under sanitizer slowdown; exact tick prints belong to
// the count-driven interval only. The nullable handle IS the real spinner
// pattern (interval: ReturnType<typeof setInterval> | null).
let fast: ReturnType<typeof setInterval> | null = null;
let fastTicks = 0;
fast = setInterval(() => {
  fastTicks++;
}, 10);

let slowTicks = 0;
const slow = setInterval(() => {
  slowTicks++;
  console.log("slow", slowTicks);
  if (slowTicks === 2) {
    clearInterval(slow);
    console.log("slow cleared");
  }
}, 50);

setTimeout(() => {
  if (fast !== null) {
    clearInterval(fast);
    fast = null;
    console.log("fast cleared", fastTicks >= 1);
  }
}, 500);

async function waiter(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
  console.log("fiber woke", fastTicks >= 1, slowTicks === 2);
}
waiter();
console.log("main done");
