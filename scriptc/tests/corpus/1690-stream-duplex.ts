// Duplex: independent halves, writes routed through the write option,
// reads through push, the half lifecycle events in Node's order, and the
// side-specific property surface.
import { Duplex } from "node:stream";

const d = new Duplex({
  highWaterMark: 16,
  read() {},
  write(chunk, enc, cb) {
    console.log("wrote:", chunk.toString());
    cb();
  },
});
console.log("props:", d.readableHighWaterMark, d.writableHighWaterMark, d.allowHalfOpen);
d.on("data", (c: Buffer) => console.log("data:", c.toString()));
d.on("end", () => console.log("end"));
d.on("finish", () => console.log("finish"));
d.on("close", () => console.log("close"));
d.push("readable side");
d.write("writable side");
d.end();
d.push(null);
console.log("tail:", d.writableEnded, d.readableEnded);
