// @exit: 1
// The special 'error' event: a listener handles it like any event; with
// NO listener the payload THROWS — catchable, and an uncaught one exits 1
// (stderr formats differ by documented divergence; stdout is compared).
import { EventEmitter } from "node:events";

class DiskError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "DiskError";
  }
}

const e = new EventEmitter();
e.on("error", (err: Error) => console.log("handled:", err.name, err.message));
console.log(e.emit("error", new Error("soft failure")));
e.removeAllListeners("error");

try {
  e.emit("error", new DiskError("disk on fire"));
} catch (err) {
  if (err instanceof DiskError) {
    console.log("caught subclass:", err.message);
  }
}

console.log("before the fatal emit");
e.emit("error", new Error("unhandled fatal"));
console.log("unreachable");
