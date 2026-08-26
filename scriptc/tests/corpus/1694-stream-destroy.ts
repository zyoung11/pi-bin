// destroy(): the user _destroy hook running synchronously, 'error' then
// 'close' on ticks (error first, Node's order), errored/destroyed
// property answers, and destroy() without an error skipping 'error'.
import { Readable, Writable } from "node:stream";

const r = new Readable({
  read() {},
  destroy(err, callback) {
    console.log("_destroy:", err === null ? "no error" : err.message);
    callback(err);
  },
});
r.on("error", (e: Error) => console.log("error:", e.message));
r.on("close", () => console.log("r close"));
r.destroy(new Error("boom"));
console.log("after destroy:", r.destroyed, r.errored === null ? "clean" : r.errored.message);

const w = new Writable({
  write(c, e, cb) {
    cb();
  },
});
w.on("close", () => console.log("w close"));
w.destroy();
console.log("w destroyed:", w.destroyed, w.errored === null ? "clean" : "errored");
