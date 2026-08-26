// @exit: 3
// process.exit(n) ends the process immediately with code n: nothing after
// it runs — not in the calling function, not at top level, not in an
// enclosing try/finally on the way out.
function step(n: number): number {
  console.log("step", n);
  if (n >= 2) {
    process.exit(3);
    console.log("dead: after exit inside step");
  }
  return n + 1;
}

console.log("start");
let i = 0;
try {
  while (true) {
    i = step(i);
  }
} catch {
  console.log("dead: exit is not a catchable exception");
}
console.log("dead: after top-level loop");
