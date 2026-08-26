// util.promisify(execFile) — the one lowered promisify shape: a const
// binding whose calls run the file (no shell, PATH-searched) and settle
// with { stdout, stderr }, Node's promisified execFile exactly. Fulfilled
// on exit 0 (both streams captured, no echo); rejected with Node's async
// messages — "Command failed: <cmd>\n<stderr>" (unconditional newline)
// on a non-zero exit, "spawn <file> ENOENT" with .code on spawn failure,
// and a timeout reporting as an ordinary SIGTERM command failure (never
// ETIMEDOUT — the sync forms' spelling). Options: encoding utf8/utf-8,
// cwd, env (replaces), timeout, maxBuffer (accepted, unenforced).
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function main(): Promise<void> {
  const { stdout, stderr } = await execFileAsync("printf", ["hi"]);
  console.log("plain:", stdout, "stderr empty:", stderr === "");

  const { stdout: o2, stderr: e2 } = await execFileAsync(
    "/bin/sh",
    ["-c", "printf out; printf err >&2"],
    { encoding: "utf-8", timeout: 5000 },
  );
  console.log("both:", o2, e2);

  const childEnv: Record<string, string | undefined> = { ...process.env, SCRIPTC_X: "envval" };
  const { stdout: o3 } = await execFileAsync("/bin/sh", ["-c", "printf \"$SCRIPTC_X:$PWD\""], {
    env: childEnv,
    cwd: "/",
  });
  console.log("env+cwd:", o3);

  try {
    await execFileAsync("/bin/sh", ["-c", "printf failerr >&2; exit 3"]);
  } catch (e) {
    // Node's promisified form ALSO stamps the exit status as a numeric
    // .code here (3) — a number in a string-typed slot has no lowering,
    // so reads answer undefined (SEMANTICS.md divergence 13/50). The
    // message is byte-exact.
    if (e instanceof Error) console.log("fail:", JSON.stringify(e.message));
  }
  try {
    await execFileAsync("definitely-not-a-binary-xyz", []);
  } catch (e) {
    if (e instanceof Error) {
      console.log("spawnfail:", e.message, "code:", `${(e as NodeJS.ErrnoException).code}`);
    }
  }
  try {
    await execFileAsync("sleep", ["2"], { timeout: 100 });
  } catch (e) {
    if (e instanceof Error) console.log("timeout:", JSON.stringify(e.message));
  }
  console.log("done");
}
main();
