// process.removeListener IS off — Node aliases them. Two SIGINT listeners
// registered, one removed by identity before the delivery: only the
// survivor fires, in registration order, and removing the last listener
// afterwards restores the default disposition (nothing left to observe —
// the child has already exited). The 1443 shape: a shell child signals
// $PPID with serializing sleeps so the delivery lands in its own turn.
import { spawn } from "node:child_process";

let a = 0;
let b = 0;
const onA = (): void => {
  a++;
  console.log("A", a);
};
const onB = (): void => {
  b++;
  console.log("B", b);
};
process.on("SIGINT", onA);
process.on("SIGINT", onB);
process.removeListener("SIGINT", onA);

const child = spawn("/bin/sh", ["-c", "sleep 0.2; kill -INT $PPID; sleep 0.2"], {
  stdio: "ignore",
});
child.on("exit", (code) => {
  console.log("child exit", code ?? -1, "A", a, "B", b);
  process.removeListener("SIGINT", onB);
  console.log("handlers off");
});
console.log("main done");
