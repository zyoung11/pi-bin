// node:readline under the corpus harness's immediately-closed stdin: the
// question writes its prompt (Node writes under pipes too), EOF closes
// the interface — 'close' fires, the answer callback never does — and a
// question after close() throws Node's use-after-close Error, catchably.
// close() twice is a no-op, and a close listener registered after the
// close never fires (Node: listeners added after the emit don't run).
import * as readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.on("close", () => {
  console.log("closed");
  rl.close(); // twice: a no-op, like Node
  try {
    rl.question("again> ", (a) => {
      console.log("never answers", a);
    });
  } catch (e) {
    if (e instanceof Error) console.log("after close:", e.name, JSON.stringify(e.message));
  }
  rl.on("close", () => {
    console.log("late listener (never prints)");
  });
});
rl.question("never> ", (answer) => {
  console.log("answer (never prints)", answer);
});
console.log("main done");
