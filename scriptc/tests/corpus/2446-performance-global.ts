// The `performance` GLOBAL — Node exposes node:perf_hooks' performance
// object with no import, and the global spelling lowers through the same
// tables as the module export (2427 pins the imported twin): now() reads
// the process-start-anchored monotonic clock, .bind(performance) is the
// () => number function value, globalThis.performance is the same object,
// and a `const perf = performance` snapshot aliases it (the tamper-guard
// idiom). Raw readings are nondeterministic — print invariants.
const t0 = performance.now();
const getTimestamp = performance.now.bind(performance);
let s = 0;
for (let i = 0; i < 100000; i++) s += i % 7;
const t1 = getTimestamp();
const t2 = globalThis.performance.now();
const perf = performance;
const t3 = perf.now();
console.log(typeof t0, typeof t1, typeof t2, typeof t3);
console.log(t0 >= 0, t1 >= t0, t2 >= t1, t3 >= t2, t3 < 120000);
console.log(s);
