// spawnSync's `error` property (divergence 27 revisited): a spawn FAILURE
// (nonexistent binary) never throws — the result carries a real Error
// ("spawnSync <file> ENOENT", `code` stamped) exactly like Node's uv
// errnoException; a successful spawn (whatever the exit status) reads
// `error` as undefined. The mdns/tailscale narrowing idioms compile.
import { spawnSync } from "node:child_process";

// Spawn failure: ENOENT.
const missing = spawnSync("definitely-not-a-binary-xyz", [], { encoding: "utf8" });
console.log("status:", missing.status === null ? "null" : `${missing.status}`);
if (missing.error) {
  console.log("message:", missing.error.message);
  console.log("instanceof:", missing.error instanceof Error);
  const errno = missing.error as NodeJS.ErrnoException;
  console.log("code:", `${errno.code}`, errno.code === "ENOENT");
}

// The mdns idiom: optional-chained code read off the cast.
const dns = spawnSync("definitely-not-a-binary-xyz", ["-h"], { encoding: "utf8" });
console.log("available:", (dns.error as NodeJS.ErrnoException | undefined)?.code !== "ENOENT");

// Success (exit 0) and plain failure (exit 3): no error either way.
const ok = spawnSync("/bin/sh", ["-c", "echo hi"], { encoding: "utf8" });
console.log("ok error:", ok.error === undefined, ok.status === 0, ok.stdout.trim());
const failed = spawnSync("/bin/sh", ["-c", "exit 3"], { encoding: "utf8" });
console.log("failed error:", failed.error === undefined, failed.status === 3);

// The tailscale idiom: error-or-status guard.
function describe(cmd: string): string {
  const result = spawnSync(cmd, ["--version"], { encoding: "utf8" });
  if (result.error) {
    const errno = result.error as NodeJS.ErrnoException;
    return `spawn failed (${errno.code})`;
  }
  if (result.status !== 0) return `exited ${result.status}`;
  return "ran";
}
console.log(describe("/bin/sh"));
console.log(describe("definitely-not-a-binary-xyz"));
