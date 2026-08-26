// execSync/execFileSync with stdio "inherit": the child keeps the
// PARENT'S fds (true passthrough, not capture-and-echo) — the
// npm-install-in-a-CLI spelling (`execSync("npm i -g tool", { stdio:
// "inherit" })`). Ordering with the parent's own writes must match Node.
// The call's RESULT under an inherited stdout is "" where Node answers
// null (nothing captures) — a documented divergence; the mutate-the-
// terminal spelling discards it, as here.
import { execFileSync, execSync } from "node:child_process";

console.log("before");
execSync("echo child-out; echo child-err 1>&2", { stdio: "inherit" });
console.log("after");

// The 3-tuple spelling: stdout inherited, stderr ignored.
execFileSync("sh", ["-c", "echo tuple-out; echo dropped 1>&2"], {
  stdio: ["ignore", "inherit", "ignore"],
});

// A failing inherited child still throws Node's message — with nothing
// captured, no stderr tail is appended.
try {
  execSync("echo shown-first; exit 5", { stdio: "inherit" });
} catch (e) {
  console.log("fail:", e instanceof Error ? e.message : "?");
}

// Inherit composes with cwd and env like every other option.
execSync("echo cwd=$PWD flag=$SCRIPTC_INHERIT_FLAG", {
  stdio: "inherit",
  cwd: "/",
  env: { SCRIPTC_INHERIT_FLAG: "on" },
});
console.log("done");
