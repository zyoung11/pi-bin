// spawn through `node` — the platform-neutral ASYNC story: exit codes,
// pipe streams (data totals + the 'end' events), kill reporting
// (null, 'SIGTERM') on every platform (win32: TerminateProcess with
// libuv's signal-name reporting), and the spawn-failure 'error' event
// with its code. Sequential — each step launches from the previous
// step's terminal event — so every line is deterministic.
import { spawn } from "node:child_process";
import { StringDecoder } from "node:string_decoder";

function step1(): void {
  const clean = spawn("node", ["-e", "process.exit(5)"], { stdio: "ignore" });
  clean.on("exit", (code, signal) => {
    console.log(`clean: ${code} ${signal}`, clean.pid !== undefined);
    step2();
  });
}

function step2(): void {
  // Piped stdout/stderr: totals asserted (chunk boundaries are
  // scheduling noise), and the observation waits for both 'end's AND
  // 'exit' before printing.
  const child = spawn(
    "node",
    ["-e", "process.stdout.write('hello\\nworld\\n'); process.stderr.write('warn\\n'); process.exit(3)"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  const outDec = new StringDecoder("utf8");
  const errDec = new StringDecoder("utf8");
  let outText = "";
  let errText = "";
  let exitCode = -1;
  let ends = 0;
  const finish = (): void => {
    if (ends < 2 || exitCode < 0) return;
    console.log("piped:", JSON.stringify(outText), JSON.stringify(errText), exitCode);
    step3();
  };
  child.stdout?.on("data", (chunk) => {
    outText += outDec.write(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    errText += errDec.write(chunk);
  });
  child.stdout?.on("end", () => {
    ends++;
    finish();
  });
  child.stderr?.on("end", () => {
    ends++;
    finish();
  });
  child.on("exit", (code) => {
    exitCode = code ?? -2;
    finish();
  });
}

function step3(): void {
  // kill: SIGTERM lands as (null, 'SIGTERM') everywhere.
  const slow = spawn("node", ["-e", "setTimeout(() => {}, 30000)"], { stdio: "ignore" });
  slow.on("exit", (code, signal) => {
    console.log(`killed: ${code} ${signal}`, slow.killed);
    step4();
  });
  console.log("kill sent:", slow.kill("SIGTERM"));
}

function step4(): void {
  const bad = spawn("definitely-not-a-binary-xyz", [], { stdio: "ignore" });
  bad.on("error", (err) => {
    console.log(`error: ${err.message} ${(err as NodeJS.ErrnoException).code}`);
    console.log("pid gone:", bad.pid === undefined);
  });
  bad.on("exit", () => {
    console.log("exit must not fire on spawn failure");
  });
}

step1();
console.log("main done");
