// Node truncates timer delays to integer milliseconds (lib/internal/
// timers.js): 1, 1.8, 1.1, and 1 all land in the 1ms bucket, so the batch
// fires in REGISTRATION order — deterministic FIFO, no wall-clock margin
// involved. Sub-millisecond and non-finite delays clamp to 1 the same way
// (the 0.5 timer joins the same bucket in its registration slot).
const ordering: number[] = [];
setTimeout(() => {
  ordering.push(1);
}, 1);
setTimeout(() => {
  ordering.push(2);
}, 1.8);
setTimeout(() => {
  ordering.push(3);
}, 1.1);
setTimeout(() => {
  ordering.push(4);
}, 0.5);
setTimeout(() => {
  console.log("order", ordering.join(","));
}, 2);
console.log("main done");
