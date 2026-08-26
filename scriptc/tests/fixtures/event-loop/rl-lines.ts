// One interface, sequential questions: the second question registers
// inside the first's callback, so a single chunk carrying several lines
// answers both in order — and a line with NO pending question drops
// (Node's unheard 'line' emit). EOF closes with the partial discarded.
import * as readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.on("close", () => {
  console.log("closed");
});
rl.question("q1> ", (a1) => {
  console.log("a1:", JSON.stringify(a1));
  rl.question("q2> ", (a2) => {
    console.log("a2:", JSON.stringify(a2));
  });
});
console.log("main done");
