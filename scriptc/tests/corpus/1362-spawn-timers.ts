// Concurrent children with interleaved timers: two children started
// together (one instant, one sleeping 1s) and two timers between the
// margins — the ordering is deterministic with ~700ms of slack per step,
// and the children run CONCURRENTLY (total runtime ~2s, not the sum).
import { spawn } from "node:child_process";

const slow = spawn("/bin/sh", ["-c", "sleep 1"], { stdio: "ignore" });
slow.on("exit", (code) => {
  console.log("slow exit", code ?? -1);
});

const fast = spawn("true", [], { stdio: "ignore" });
fast.on("exit", (code) => {
  console.log("fast exit", code ?? -1);
});

setTimeout(() => {
  console.log("timer 700");
}, 700);
setTimeout(() => {
  console.log("timer 2000");
}, 2000);

// A third child, spawned FROM a listener: reaping keeps working while
// timers are pending, and the loop stays alive for late children.
fast.on("exit", () => {
  const late = spawn("/bin/sh", ["-c", "exit 9"], { stdio: "ignore" });
  late.on("exit", (code) => {
    console.log("late exit", code ?? -1);
  });
});

console.log("main done");
