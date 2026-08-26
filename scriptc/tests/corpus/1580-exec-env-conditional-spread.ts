// execFileSync/execSync with the conditional env spread — the openssl-
// runner shape: `...(c ? { env: { ...process.env, ...extra } } : {})`.
// The condition evaluates once; the env pairs build only in their own arm
// (where tsc's narrowing of the condition holds — extra is Record | null).
import { execFileSync, execSync } from "node:child_process";

function run(extraEnv: Record<string, string> | null): string {
  return execFileSync("sh", ["-c", "echo A=$SCRIPTC_SPREAD_A B=$SCRIPTC_TEST_ENV"], {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
    ...(extraEnv && Object.keys(extraEnv).length > 0
      ? { env: { ...process.env, ...extraEnv } }
      : {}),
  });
}
// Absent arm: the child inherits (SCRIPTC_TEST_ENV comes from the harness).
process.stdout.write("inherit: " + run(null));
process.stdout.write("empty: " + run({}));
// Present arm: the merged env replaces, keeping the inherited variable.
process.stdout.write("merged: " + run({ SCRIPTC_SPREAD_A: "one" }));

// The other orientation, through the shell form.
function shellRun(quiet: boolean): string {
  return execSync("echo Q=$SCRIPTC_SPREAD_Q", {
    encoding: "utf8",
    ...(quiet ? {} : { env: { SCRIPTC_SPREAD_Q: "loud" } }),
  });
}
process.stdout.write("loud: " + shellRun(false));
process.stdout.write("quiet: " + shellRun(true));

// Composes with the optional input member in the same options literal —
// the certs.ts openssl shape verbatim.
function openssl(args: string[], options?: { input?: string }): string {
  const extraEnv: Record<string, string> | null = { SCRIPTC_SPREAD_A: "x" };
  return execFileSync("cat", args, {
    encoding: "utf-8",
    input: options?.input,
    stdio: ["pipe", "pipe", "pipe"],
    ...(extraEnv && Object.keys(extraEnv).length > 0
      ? { env: { ...process.env, ...extraEnv } }
      : {}),
  });
}
process.stdout.write("piped: " + openssl([], { input: "body\n" }));
console.log("no-input:", JSON.stringify(openssl([])));
