// The exit listener's second parameter — Node's terminating signal as
// `Signals | null`: null for a normal exit (code carries the status),
// the signal's name for a signal death (code is null). Sequential
// spawns (each child spawned inside the previous exit handler) pin the
// event order without racing real time.
import { spawn } from "node:child_process";

const clean = spawn("sh", ["-c", "exit 3"], { stdio: "ignore" });
clean.on("exit", (code, signal) => {
  console.log(`clean: ${code} ${signal}`, signal === null);

  const killed = spawn("sh", ["-c", "kill -TERM $$"], { stdio: "ignore" });
  killed.on("exit", (code2, signal2) => {
    console.log(`killed: ${code2} ${signal2}`);
    if (signal2) console.log("narrowed:", signal2 === "SIGTERM", `exit(${128 + 15})`);

    // The one-param and zero-param shapes keep working beside it.
    const quiet = spawn("true", [], { stdio: "ignore" });
    quiet.on("exit", (code3) => {
      console.log(`quiet: ${code3}`);
    });
  });
});
console.log("main done");
