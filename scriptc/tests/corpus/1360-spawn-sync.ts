// child_process.spawnSync: run a child to completion, capture its utf8
// stdout/stderr, and read the exit status. Every read of stdout/stderr
// passes { encoding: "utf8" } so plain Node (the oracle) hands strings
// too. Everything printed here is deterministic.
import { spawnSync } from "node:child_process";

// stdout capture + exit 0.
const echo = spawnSync("/bin/echo", ["hello", "spawn"], { encoding: "utf8" });
console.log(echo.stdout);
console.log(echo.status ?? -1);

// Nonzero exit codes come through; stderr captures separately.
const sh = spawnSync("/bin/sh", ["-c", "echo out; echo err 1>&2; exit 3"], {
  encoding: "utf8",
});
console.log(sh.status ?? -1, sh.stdout, sh.stderr);

// Status-only use: the args list (and the options) may be omitted.
const t = spawnSync("true");
console.log(t.status ?? -1);

// PATH search works like Node's (no shell involved).
const viaPath = spawnSync("echo", ["via-path"], { encoding: "utf8" });
console.log(viaPath.stdout);

// A signal-killed child has NO status (the null arm); its captured
// outputs are empty strings.
const killed = spawnSync("/bin/sh", ["-c", "kill -KILL $$"], { encoding: "utf8" });
console.log(killed.status === null, killed.stdout.length, killed.stderr.length);

// A child that cannot be spawned at all: status is null too, and nothing
// throws. (Node types stdout/stderr null there — not printed, the
// documented divergence; status is Node-exact.)
const missing = spawnSync("/definitely/not/a/binary");
console.log(missing.status === null);

// Output beyond one pipe buffer drains without deadlock, on both streams.
const big = spawnSync(
  "/bin/sh",
  ["-c", 'i=0; while [ $i -lt 3000 ]; do echo "line $i of many"; echo "err $i" 1>&2; i=$((i+1)); done'],
  { encoding: "utf8" },
);
console.log(big.status ?? -1, big.stdout.length, big.stderr.length);

// The result is an ordinary value: it flows through variables and
// re-reads agree.
const again = big;
console.log(again.stdout.length === big.stdout.length);

// The bare specifier works like the node:-prefixed one.
console.log(spawnSync("/bin/echo", ["done"], { encoding: "utf8" }).stdout);
