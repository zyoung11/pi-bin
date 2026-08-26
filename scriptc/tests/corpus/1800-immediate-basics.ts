// setImmediate rides Node's check phase: FIFO within a turn, an immediate
// queued DURING the phase waits for the next turn (but still runs after
// every immediate queued before it — the observable order is pure FIFO by
// queue time), and clearImmediate cancels a not-yet-fired entry (the
// forward-declared handle: module-scope bindings resolve at fire time).
// Order-only assertions — no timers, no wall clock.
setImmediate(() => {
  console.log("A");
  setImmediate(() => {
    console.log("D queued mid-phase");
  });
});
setImmediate(() => {
  console.log("B");
  clearImmediate(dead);
});
const dead = setImmediate(() => {
  console.log("never");
});
setImmediate(() => {
  console.log("C");
});
console.log("main done");
