// The sibling of 1471's kill-then-exit shape: killing an unref'd child
// while a REFFED holder still lives. The unref'd child is still reaped
// while something refs the loop — the long timer holds it past the kill,
// so the signal death's exit (code null, SIGTERM) DOES fire, byte-exact
// vs Node. (In 1471 the killing timer is the LAST holder: liveness fails
// before any further reap and the exit never delivers — both worlds.)
import { spawn } from "node:child_process";

const child = spawn("sleep", ["30"], { stdio: "ignore" });
child.unref();
child.on("exit", (code, signal) => {
  console.log("exit fired:", code === null, signal === "SIGTERM");
});

setTimeout(() => {
  console.log("killing:", child.kill());
}, 100);

// The reffed holder outliving the kill by 20x — sanitizer/load slowdown
// never reorders the reap past it (the bounded-margin rule).
setTimeout(() => {
  console.log("holder done");
}, 2000);
console.log("main done");
