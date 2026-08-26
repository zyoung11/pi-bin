// spawnSync through the `node` binary on PATH — the PLATFORM-NEUTRAL
// spawn story (the older spawn fixtures reach for /bin/sh, which no
// Windows box has): capture, argv round-tripping (the child reports its
// own argv as JSON — on win32 this is the libuv quote_cmd_arg
// algorithm's proof, byte-compared against Windows Node building the
// same command line), exit codes, ENOENT spawn failure, the stdio
// "ignore" probe shape, and timeout + killSignal. Timing facts are
// BOUNDED (a 10s sleep dies to a 500ms timeout), so every line is
// deterministic.
import { spawnSync } from "node:child_process";

// Capture + exit 0.
const hello = spawnSync("node", ["-e", "console.log('hello from child')"], { encoding: "utf8" });
console.log(`${JSON.stringify(hello.stdout)} ${hello.status}`);

// argv round-trip through every quoting tier: plain, spaces, tabs,
// embedded quotes, backslash runs, a trailing backslash, quote-after-
// backslash mixes, and the empty argument.
const echo = spawnSync(
  "node",
  [
    "-p",
    "JSON.stringify(process.argv.slice(1))",
    "plain",
    "with space",
    "tab\there",
    'quote"inside',
    "trailing\\",
    "back\\slash",
    'both\\"mix',
    "run\\\\",
    "",
    "last one",
  ],
  { encoding: "utf8" },
);
console.log(echo.stdout);
console.log(`${echo.status}`);

// Exit codes come through; stderr captures separately from stdout.
const parts = spawnSync("node", ["-e", "console.log('out'); console.error('err'); process.exit(3)"], {
  encoding: "utf8",
});
console.log(`${parts.status} ${JSON.stringify(parts.stdout)} ${JSON.stringify(parts.stderr)}`);

// A missing binary: status null, error.code ENOENT — data, not a throw.
const missing = spawnSync("definitely-not-a-binary-xyz", [], { encoding: "utf8" });
console.log(`${missing.status} ${(missing.error as NodeJS.ErrnoException | undefined)?.code}`);

// stdio "ignore" + a generous timeout: the probe shape.
const probe = spawnSync("node", ["-e", ""], { stdio: "ignore", timeout: 30_000 });
console.log(`probe: ${probe.status} ${probe.signal}`, probe.error === undefined);

// Timeout: the killSignal lands; status null, signal reports the kill,
// error.code ETIMEDOUT.
const slow = spawnSync("node", ["-e", "setTimeout(() => {}, 10000)"], { timeout: 500, encoding: "utf8" });
console.log(`timeout: ${slow.status} ${slow.signal} ${(slow.error as NodeJS.ErrnoException | undefined)?.code}`);
