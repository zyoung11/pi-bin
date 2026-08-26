// child.unref(): an unref'd child does not keep the event loop alive —
// this program exits BEFORE its child's sleep finishes (Node and the
// binary agree: no exit event ever fires, the last line is the timer's).
// An unref'd child is still REAPED while the loop runs for other reasons:
// the short child's exit fires because the 200ms timer holds the loop
// open past it.
import { spawn } from "node:child_process";

// Long child, unreffed: never observed — the process exits without it.
const slow = spawn("sleep", ["30"], { stdio: "ignore" });
slow.unref();
slow.on("exit", () => {
  console.log("slow exit fired (never prints)");
});

// Short child, unreffed too — but the timer keeps the loop alive past its
// exit, so the reap still happens and the listener fires, exactly Node.
// The timer sits 30x past the child's sleep so sanitizer/load slowdown
// never reorders the two (the bounded-margin rule for wall-clock corpus).
const quick = spawn("sleep", ["0.05"], { stdio: "ignore" });
quick.unref();
quick.on("exit", (code) => {
  console.log("quick exit", code ?? -1);
});

setTimeout(() => {
  console.log("timer fired; slow killed:", slow.kill());
}, 1500);
console.log("main done");
