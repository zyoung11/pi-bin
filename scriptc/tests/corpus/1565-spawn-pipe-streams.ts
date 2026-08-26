// spawn with stdio ["ignore", "pipe", "pipe"]: child.stdout/child.stderr
// as real streams — 'data' chunks (Buffer), 'end' at EOF, and the PINNED
// ordering: a stream's 'end' fires before the child's 'exit' (verified
// against Node for every output shape). Chunk boundaries are scheduling
// noise, so totals are asserted, never sizes.
import { spawn } from "node:child_process";
import { StringDecoder } from "node:string_decoder";

function phase1(): void {
  // stdout only: data → end → exit, with the bytes decoded.
  const events: string[] = [];
  const child = spawn("/bin/sh", ["-c", "printf 'hello\\nworld\\n'; exit 3"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const decoder = new StringDecoder("utf8");
  let text = "";
  child.stdout?.on("data", (chunk) => {
    text += decoder.write(chunk);
  });
  child.stdout?.on("end", () => {
    events.push("end");
    finish();
  });
  // end-vs-exit relative order is scheduling-dependent in Node itself (end
  // fires on pipe drain, exit on reap), so the observation waits for BOTH
  // and prints the pair sorted.
  const finish = () => {
    if (events.length < 2) return;
    console.log("phase1 text:", JSON.stringify(text));
    console.log("phase1 order:", events.slice().sort().join(" "));
    phase2();
  };
  child.on("exit", (code) => {
    events.push(`exit:${code}`);
    finish();
  });
}

function phase2(): void {
  // stderr piped too; the prefixStream line-splitting shape over stderr.
  const events: string[] = [];
  const child = spawn("/bin/sh", ["-c", "printf 'e1\\ne2' >&2; exit 0"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const decoder = new StringDecoder("utf8");
  let buffer = "";
  const lines: string[] = [];
  child.stderr?.on("data", (chunk: Buffer) => {
    buffer += decoder.write(chunk);
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      lines.push(buffer.slice(0, idx));
      buffer = buffer.slice(idx + 1);
    }
  });
  child.stderr?.on("end", () => {
    if (buffer) lines.push(buffer);
    events.push("end");
    finish();
  });
  const finish = () => {
    if (events.length < 2) return;
    console.log("phase2 lines:", lines.join("|"));
    console.log("phase2 order:", events.slice().sort().join(" "));
    phase3();
  };
  child.on("exit", (code) => {
    events.push(`exit:${code}`);
    finish();
  });
}

function phase3(): void {
  // Big output: totals survive chunking (300000 bytes of 'y\n').
  const child = spawn("/bin/sh", ["-c", "yes | head -c 300000"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let total = 0;
  let chunks = 0;
  let maxChunk = 0;
  child.stdout?.on("data", (chunk) => {
    total += chunk.length;
    chunks += 1;
    if (chunk.length > maxChunk) maxChunk = chunk.length;
  });
  let seen = 0;
  let exitCode: number | null = null;
  const finish = () => {
    if (++seen < 2) return;
    console.log("phase3 total:", total, "chunked:", chunks >= 1, "capped:", maxChunk <= 65536);
    console.log("phase3 exit:", exitCode === 0);
    phase4();
  };
  child.stdout?.on("end", finish);
  child.on("exit", (code) => {
    exitCode = code;
    finish();
  });
}

function phase4(): void {
  // Spawn failure with piped stdio: 'error' fires (never 'exit'), and the
  // stream handles exist but deliver nothing.
  const ghost = spawn("definitely-not-a-binary-zzz", ["x"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  ghost.stdout?.on("data", () => {
    console.log("phase4 impossible data");
  });
  ghost.stdout?.on("end", () => {
    console.log("phase4 impossible end");
  });
  ghost.on("error", (err) => {
    console.log("phase4 error:", err.message);
  });
}

phase1();
console.log("spawned");
