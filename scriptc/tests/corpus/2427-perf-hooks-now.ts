// node:perf_hooks performance.now(): fractional ms on the monotonic clock
// anchored at process start (Node's timeOrigin), plus the
// .bind(performance) function-value spelling (the mockable-clock idiom's
// getTimestamp). Raw readings are nondeterministic — print invariants.
import { performance } from "node:perf_hooks";

const t0 = performance.now();
const getTimestamp = performance.now.bind(performance);
let s = 0;
for (let i = 0; i < 100000; i++) s += i % 7;
const t1 = getTimestamp();
const t2 = performance.now();
console.log(typeof t0, typeof t1, typeof t2);
console.log(t0 >= 0, t1 >= t0, t2 >= t1, t2 < 120000);
console.log(s);
