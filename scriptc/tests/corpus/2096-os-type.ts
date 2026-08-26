// os.type() and os.totalmem() — differential against the host's own Node:
// type() is uname(2)'s sysname (the process.platform mapping pins it per
// host), totalmem() is the same physical-memory byte count Node reads.
import * as os from "node:os";

const expected =
  process.platform === "darwin"
    ? "Darwin"
    : process.platform === "win32"
      ? "Windows_NT"
      : "Linux";
console.log(os.type() === expected);
console.log(os.type().length > 0);

const mem = os.totalmem();
console.log(mem > 0);
console.log(Number.isInteger(mem));
