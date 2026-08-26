// setInterval rides the timer heap: ticks fire on period, the handle is
// Node's Timeout shape (hasRef() answers true while armed and reffed), a
// setTimeout landing between ticks keeps FIFO deadline order, and
// clearInterval releases the loop — the program exits after "cleared"
// even though the interval had no natural end.
let n = 0;
const id = setInterval(() => {
  n++;
  console.log("tick", n);
  if (n === 3) {
    clearInterval(id);
    console.log("cleared");
  }
}, 40);
setTimeout(() => {
  console.log("timeout between ticks");
}, 60);
console.log("main done", id.hasRef());
