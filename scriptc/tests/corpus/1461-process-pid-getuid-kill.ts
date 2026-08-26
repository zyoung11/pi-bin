// process.pid / process.getuid() / process.kill(): POSIX process identity
// plus Node's kill semantics — signal-0 probes, signal name strings, the
// SIGTERM default's error on a nonexistent pid, and Node's exact error
// messages for unknown signals and non-int32 pids.
const pid = process.pid;
console.log("pid > 0:", pid > 0);
console.log("pid is integer:", Number.isInteger(pid));

const uid = process.getuid?.() ?? -1;
console.log("uid >= 0:", uid >= 0);
console.log("uid is integer:", Number.isInteger(uid));

// Signal 0: existence probe, sends nothing.
console.log("probe self:", process.kill(pid, 0));

// A harmless real signal (default disposition of SIGWINCH is ignore).
console.log("winch self:", process.kill(pid, "SIGWINCH"));

// ESRCH: pids above every host's pid_max but inside int32.
try {
  process.kill(99999999, 0);
  console.log("esrch: no throw");
} catch (e) {
  console.log("esrch:", e instanceof Error ? e.message : "?");
}
try {
  process.kill(99999999);
  console.log("default-signal esrch: no throw");
} catch (e) {
  console.log("default-signal esrch:", e instanceof Error ? e.message : "?");
}

// Unknown signal names are TypeErrors before any kill(2) happens.
try {
  process.kill(pid, "SIGNOPE");
} catch (e) {
  console.log("bad name:", e instanceof Error ? e.message : "?");
  console.log("bad name is TypeError:", e instanceof TypeError);
}

// Non-int32 pids are TypeErrors with Node's exact wording.
try {
  process.kill(1.5, 0);
} catch (e) {
  console.log("frac pid:", e instanceof Error ? e.message : "?");
}
try {
  process.kill(2147483648, 0);
} catch (e) {
  console.log("wide pid:", e instanceof Error ? e.message : "?");
}
