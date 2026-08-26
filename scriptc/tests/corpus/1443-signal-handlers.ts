// Signal handlers, delivered for real: a shell child signals its parent
// ($PPID — this process, under Node and compiled alike) with generous
// serializing sleeps so every delivery lands in its own loop turn. `on`
// fires per delivery, `once` auto-removes, `off` removes by identity,
// and the pending child keeps the loop alive through it all (signal
// listeners themselves never do — Node's rule).
import { spawn } from "node:child_process";

let ints = 0;
const onInt = () => {
  ints++;
  console.log("SIGINT", ints);
};
process.on("SIGINT", onInt);
process.once("SIGTERM", () => {
  console.log("SIGTERM once");
});

const child = spawn(
  "/bin/sh",
  ["-c", "sleep 0.2; kill -INT $PPID; sleep 0.3; kill -INT $PPID; sleep 0.3; kill -TERM $PPID; sleep 0.2"],
  { stdio: "ignore" },
);
child.on("exit", (code) => {
  console.log("child exit", code ?? -1, "ints", ints);
  setTimeout(() => {
    process.off("SIGINT", onInt);
    console.log("handlers off");
  }, 50);
});
console.log("main done");
