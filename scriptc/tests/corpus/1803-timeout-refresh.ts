// Timeout.refresh() from inside the timer's own callback re-arms the
// one-shot to now + the original delay: the callback runs exactly twice
// (Node's refresh contract), and refresh chains like unref/ref (it
// returns the handle). An interval's tick count is unaffected by its own
// re-arm machinery. Order-only: one timer chain, counts not wall time.
let fires = 0;
const t = setTimeout(() => {
  fires++;
  console.log("fire", fires);
  if (fires === 1) {
    t.refresh();
  }
}, 1);
console.log("armed", t.hasRef());
let ticks = 0;
const iv = setInterval(() => {
  ticks++;
  if (ticks === 3) {
    clearInterval(iv);
    console.log("interval done", ticks);
  }
}, 1);
console.log("main done");
