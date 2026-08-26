// process.nextTick: the user tick queue. Ticks drain BEFORE promise jobs
// at every loop checkpoint, to joint exhaustion (a microtask's nextTick
// still beats the next macrotask); trailing arguments pass to the callback
// at fire time; FIFO order holds across nesting; ticks scheduled from an
// 'exit' listener never run (Node drops the queue at exit).
const order: string[] = [];

process.nextTick(() => order.push("tick1"));
Promise.resolve().then(() => {
  order.push("micro1");
  process.nextTick(() => order.push("tick-from-micro"));
});
process.nextTick(() => {
  order.push("tick2");
  process.nextTick(() => order.push("tick3-nested"));
});
process.nextTick((a: number, b: string) => order.push(`args:${a}:${b}`), 7, "x");

setTimeout(() => {
  order.push("timer");
  process.nextTick(() => order.push("tick-in-timer"));
  Promise.resolve().then(() => order.push("micro-in-timer"));
  setTimeout(() => {
    console.log(order.join(","));
  }, 1);
}, 1);

process.on("exit", (code: number) => {
  // Too late: this tick never runs (printing from it would fail the diff).
  process.nextTick(() => console.log("SHOULD NOT RUN"));
  console.log("exit", code);
});
console.log("main done");
