// The ngrok idiom end-to-end: a USER-declared child-shaped interface
// (`spawn(...) as MyChild` — declared so tests can hand in mocks) maps to
// the child handle; its stdout/stderr are NodeJS.ReadableStream | null,
// consumed through optional chaining with a `Buffer | string` listener
// whose chunk.toString() is the utf8 decode.
import { spawn } from "node:child_process";

interface MyChild {
  pid?: number;
  stdout: NodeJS.ReadableStream | null;
  stderr: NodeJS.ReadableStream | null;
  kill(signal?: string): boolean;
  on(event: "error", listener: (err: Error) => void): void;
  on(event: "exit", listener: (code: number | null, signal: string | null) => void): void;
}

function spawner(cmd: string): MyChild {
  return spawn("sh", ["-c", cmd], {
    stdio: ["ignore", "pipe", "pipe"],
  }) as MyChild;
}

const child = spawner("printf 'out1\\n'; printf 'err2\\n' >&2; exit 0");
let output = "";
const append = (chunk: Buffer | string): void => {
  output += chunk.toString();
};
child.stdout?.on("data", append);
child.stderr?.on("data", append);
child.on("exit", (code, signal) => {
  console.log("exit clean:", code === 0, signal === null);
  console.log("saw out1:", output.includes("out1"));
  console.log("saw err2:", output.includes("err2"));
  const pid = child.pid;
  console.log("pid real:", pid !== undefined && pid > 1);
  // The timeout-kill shape: the child is already reaped, so kill answers
  // false (Node's closed-handle answer).
  console.log("late kill:", child.kill("SIGTERM"));
});
console.log("spawned");
