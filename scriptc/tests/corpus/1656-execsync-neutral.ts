// execFileSync through `node` — the platform-neutral exec story
// (1462's option slice without /bin anywhere): capture with encoding,
// `input` feeding stdin, env REPLACEMENT, cwd, stdio "pipe" vs the
// default stderr echo, and Node's exact thrown messages for non-zero
// exits and spawn failures.
import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Plain capture (no trailing newline: write, not log).
console.log(JSON.stringify(execFileSync("node", ["-e", "process.stdout.write('a b\\nc')"], { encoding: "utf8" })));

// input feeds stdin; the child reads fd 0 to EOF.
console.log(
  "input:",
  execFileSync("node", ["-e", "process.stdout.write(require('fs').readFileSync(0, 'utf8').toUpperCase())"], {
    encoding: "utf8",
    input: "fed to node",
  }),
);

// env REPLACES the child environment: the harness marker vanishes, the
// replacement value arrives. PATH rides along explicitly — Node resolves
// the bare "node" against the CHILD's PATH, so dropping it entirely
// would fail the oracle's own spawn.
console.log(
  "env:",
  execFileSync(
    "node",
    ["-e", "console.log((process.env.SCR_A ?? 'no-a') + ' ' + (process.env.SCRIPTC_TEST_ENV ?? 'unset'))"],
    { encoding: "utf8", env: { SCR_A: "one", PATH: process.env.PATH ?? "" } },
  ),
);

// cwd: the child reports the directory it was launched in (realpath'd —
// mkdtemp answers /var/... where macOS children see /private/var/...).
const dir = realpathSync(mkdtempSync(join(tmpdir(), "scr-exec-")));
const cwdOut = execFileSync("node", ["-p", "process.cwd()"], { encoding: "utf8", cwd: dir });
console.log("cwd match:", cwdOut.trim() === dir);
rmSync(dir, { recursive: true, force: true });

// stdio "pipe": stderr captured, nothing echoes to ours.
const quiet = execFileSync("node", ["-e", "console.log('kept'); console.error('quiet-err')"], {
  encoding: "utf8",
  stdio: "pipe",
});
console.log("quiet:", JSON.stringify(quiet));

// Default stdio echoes the child's captured stderr to OUR stderr after
// the child exits — Node does the same (both lanes compare stderr too).
console.log(
  "echo:",
  JSON.stringify(
    execFileSync("node", ["-e", "console.error('visible-err'); console.log('out-part')"], { encoding: "utf8" }),
  ),
);

// Non-zero exit: Error with Node's message (command + captured stderr).
try {
  execFileSync("node", ["-e", "console.error('the-failure'); process.exit(3)"], { encoding: "utf8", stdio: "pipe" });
} catch (e) {
  console.log("fail:", e instanceof Error ? JSON.stringify(e.message) : "?");
}

// Spawn failure: "spawnSync <file> ENOENT", `code` stamped.
try {
  execFileSync("definitely-not-a-binary-xyz", [], { encoding: "utf8" });
} catch (e) {
  if (e instanceof Error) {
    console.log(`enoent: ${e.message} ${(e as NodeJS.ErrnoException).code}`);
  }
}
