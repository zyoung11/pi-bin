// The ChildProcess lifecycle members, Node's exact shapes: pid is a real
// number for a spawned child and undefined on spawn failure; exitCode is
// null while running, the code after a normal exit, null after a signal
// death, and -errno once a spawn failure's "error" fired; kill() sends
// (SIGTERM default, names via Node's table, numbers pass through) and
// answers true, false once the child was reaped or never spawned; killed
// flips on any successful send; unknown signal names throw Node's
// TypeError even on a dead handle.
import { spawn } from "node:child_process";

// A child killed mid-run: pid present, exitCode null while running,
// kill("SIGTERM") true + killed flips, exit arrives with null (signal
// death), kill after the exit answers false.
const c1 = spawn("sleep", ["5"], { stdio: "ignore" });
console.log("c1 pid > 0", (c1.pid ?? 0) > 0);
console.log(`c1 exitCode ${c1.exitCode}`);
console.log("c1 killed before", c1.killed);
console.log("c1 kill ->", c1.kill("SIGTERM"));
console.log("c1 killed after", c1.killed);
c1.on("exit", (code) => {
  console.log(`c1 exit arg ${code} exitCode prop ${c1.exitCode} killed ${c1.killed}`);
  console.log("c1 kill after exit ->", c1.kill(), "killed still", c1.killed);
  try {
    c1.kill("SIGWHATEVER");
  } catch (e) {
    if (e instanceof TypeError) console.log("unknown signal:", e.message);
  }

  // A normal exit: exitCode is the real code, killed never flips.
  const c2 = spawn("/bin/sh", ["-c", "exit 3"], { stdio: "ignore" });
  c2.on("exit", (code2) => {
    console.log(`c2 exit arg ${code2} exitCode prop ${c2.exitCode} killed ${c2.killed}`);
    console.log("c2 kill after exit ->", c2.kill());

    // Spawn failure: pid undefined, kill false, exitCode -errno (ENOENT)
    // once the error event fired.
    const c3 = spawn("definitely-not-a-binary-xyz", [], { stdio: "ignore" });
    c3.on("error", (err) => {
      console.log("c3 error", err.message);
      console.log("c3 pid undefined", c3.pid === undefined);
      console.log(`c3 exitCode after error ${c3.exitCode}`);
      console.log("c3 kill ->", c3.kill(), "killed", c3.killed);
    });
  });
});
console.log("main done");
