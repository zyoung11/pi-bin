// child_process.spawn with stdio "ignore": the promise-wrapped pattern —
// from a real CLI — with sequential awaits so every line is
// deterministic. "exit" carries the code (null for a signal death);
// "error" fires only when the binary cannot be spawned at all.
import { spawn } from "node:child_process";

function run(cmd: string, args: string[]): Promise<number> {
  return new Promise<number>((resolve) => {
    const child = spawn(cmd, args, { stdio: "ignore" });
    child.on("error", () => {
      resolve(-1);
    });
    child.on("exit", (code) => {
      resolve(code ?? -2);
    });
  });
}

async function main(): Promise<void> {
  console.log(await run("/bin/sh", ["-c", "exit 0"]));
  console.log(await run("/bin/sh", ["-c", "exit 7"]));
  console.log(await run("true", []));
  // Spawn failure: "error" fires, "exit" never does.
  console.log(await run("/definitely/not/a/binary", []));
  // Signal death: "exit" fires with NO code — the null arm.
  console.log(await run("/bin/sh", ["-c", "kill -KILL $$"]));

  // The error object carries Node's exact message.
  await new Promise<void>((resolve) => {
    const bad = spawn("/no/such/bin", [], { stdio: "ignore" });
    bad.on("error", (err) => {
      console.log(err.message);
      resolve();
    });
  });

  // Multiple listeners on one child fire in registration order.
  await new Promise<void>((resolve) => {
    const c = spawn("/bin/sh", ["-c", "exit 4"], { stdio: "ignore" });
    c.on("exit", (code) => {
      console.log("first", code ?? -1);
    });
    c.on("exit", () => {
      console.log("second");
      resolve();
    });
  });
}

main();
console.log("spawned");
