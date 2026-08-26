// Emit dispatches over a SNAPSHOT: listeners added during an emit wait
// for the next one, removed listeners still run for the current one, and
// removeAllListeners mid-emit stops nothing already snapshotted.
import { EventEmitter } from "node:events";

const e = new EventEmitter();
const log: string[] = [];
e.on("x", () => {
  log.push("1");
  e.on("x", () => log.push("late"));
});
e.on("x", () => log.push("2"));
e.emit("x");
log.push("/");
e.emit("x");
console.log(log.join(","));

const e2 = new EventEmitter();
const out: string[] = [];
const b = () => { out.push("b"); };
e2.on("r", () => {
  out.push("a");
  e2.removeListener("r", b);
});
e2.on("r", b);
e2.emit("r");
out.push("/");
e2.emit("r");
console.log(out.join(","));

const e3 = new EventEmitter();
const wipe: string[] = [];
e3.on("w", () => {
  wipe.push("first");
  e3.removeAllListeners("w");
});
e3.on("w", () => wipe.push("second"));
e3.emit("w");
console.log(wipe.join(","), e3.emit("w"), JSON.stringify(e3.eventNames()));
