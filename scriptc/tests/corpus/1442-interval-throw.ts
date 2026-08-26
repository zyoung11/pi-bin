// @exit: 1
// A throw ESCAPING an interval callback ends the program like any
// uncaught exception (Node: the process dies before another tick can
// run; exit 1, the report on stderr — stdout is what the harness
// compares). The first tick's output must land; no third tick exists.
let n = 0;
setInterval(() => {
  n++;
  console.log("tick", n);
  if (n === 2) {
    throw new Error("interval boom");
  }
}, 30);
console.log("main done");
