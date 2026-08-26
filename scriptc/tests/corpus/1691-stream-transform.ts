// Transform: _transform rewriting chunks (callback(null, data)), _flush
// appending a trailer before EOF, write-side 'finish' vs read-side 'end'
// ordering, and transformed data direct-emitting to 'data' listeners.
import { Transform } from "node:stream";

const t = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  },
  flush(callback) {
    callback(null, "!");
  },
});
t.on("data", (c: Buffer) => console.log("data:", c.toString()));
t.on("end", () => console.log("end"));
t.on("finish", () => console.log("finish"));
console.log("w:", t.write("mixed Case"));
t.end("tail");
console.log("sync");
