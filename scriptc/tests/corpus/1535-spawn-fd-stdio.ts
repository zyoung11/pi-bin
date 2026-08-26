// fs.openSync/closeSync and spawn's fd-stdio tuple — the daemon-log
// idiom: open a log fd, spawn with stdio ["ignore", fd, fd] so the
// child's stdout/stderr land in the file, close the fd, read the file
// back. Also openSync's flag grammar ("a" appends, "w" truncates), the
// invalid-flag TypeError, and closeSync's EBADF error text.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawn } from "node:child_process";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scr-fdspawn-"));
const logPath = path.join(dir, "proxy.log");

// "w" truncates/creates; "a" appends.
const wfd = fs.openSync(logPath, "w");
console.log(typeof wfd === "number", wfd >= 0);
fs.closeSync(wfd);
fs.writeFileSync(logPath, "first\n");
const afd = fs.openSync(logPath, "a");
fs.closeSync(afd);
console.log(JSON.stringify(fs.readFileSync(logPath, "utf8")));

// The daemon-log spawn: child stdout AND stderr both dup2 onto the fd.
const logFd = fs.openSync(logPath, "a");
const child = spawn("/bin/sh", ["-c", "echo out-line; echo err-line 1>&2"], {
  detached: true,
  stdio: ["ignore", logFd, logFd],
  env: process.env,
  windowsHide: true,
});
child.on("exit", (code) => {
  fs.closeSync(logFd);
  const text = fs.readFileSync(logPath, "utf8");
  console.log("exit", code ?? -1, text.includes("out-line"), text.includes("err-line"), text.startsWith("first\n"));

  // Error shapes, after the async leg so output order is deterministic.
  try {
    fs.openSync(logPath, "q");
  } catch (e) {
    if (e instanceof Error) console.log(e.name, e.message);
  }
  try {
    fs.openSync(path.join(dir, "missing", "nope.txt"), "r");
  } catch (e) {
    if (e instanceof Error) console.log(e.message.startsWith("ENOENT"), e.message.includes(", open '"));
  }
  try {
    fs.closeSync(98765);
  } catch (e) {
    if (e instanceof Error) console.log(e.message);
  }
  fs.rmSync(logPath);
  fs.rmdirSync(dir);
});
