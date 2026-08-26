// The promisified execFile with the CONDITIONAL env spread — the
// portless opensslAsync shape: `...(cond ? { env: { ...process.env,
// ...extra } } : {})` beside encoding/timeout. The condition evaluates
// once and picks between a replacement environment and inheriting the
// parent's; the carried arm's object builds only when the condition
// holds (tsc's narrowing of the condition is live inside it).
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function getExtraEnv(name: string): Record<string, string> | undefined {
  if (name === "") return undefined;
  return { SCRIPTC_EXTRA: name };
}

async function run(name: string): Promise<void> {
  const extraEnv = getExtraEnv(name);
  const { stdout } = await execFileAsync(
    "/bin/sh",
    ["-c", "printf \"[${SCRIPTC_EXTRA:-none}:${SCRIPTC_TEST_ENV:-unset}]\""],
    {
      encoding: "utf-8",
      timeout: 5000,
      ...(extraEnv && Object.keys(extraEnv).length > 0
        ? { env: { ...process.env, ...extraEnv } }
        : {}),
    },
  );
  console.log(name === "" ? "inherit:" : "extra:", stdout);
}

async function main(): Promise<void> {
  await run("");
  await run("spread-on");
  // The false-carrier orientation.
  const quiet = true;
  const { stdout } = await execFileAsync(
    "/bin/sh",
    ["-c", "printf \"${SCRIPTC_EXTRA:-none}\""],
    { ...(quiet ? {} : { env: { SCRIPTC_EXTRA: "never" } }), timeout: 5000 },
  );
  console.log("false-arm:", stdout);
  console.log("done");
}
main();
