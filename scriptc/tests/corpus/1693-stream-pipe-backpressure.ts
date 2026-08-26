// pipe backpressure: a slow destination with a tiny highWaterMark pushes
// back — the source pauses until 'drain', and every byte still arrives in
// order. Chunk sizes are compared, not timing.
import { Readable, Writable } from "node:stream";

const chunks = ["aa", "bbb", "cccc", "ddddd"];
let sent = 0;
const src = new Readable({
  read() {
    if (sent < chunks.length) {
      this.push(chunks[sent]!);
      sent++;
    } else {
      this.push(null);
    }
  },
});
let received = 0;
const dst = new Writable({
  highWaterMark: 3,
  write(chunk, enc, callback) {
    received += chunk.length;
    console.log("dst:", chunk.toString());
    setTimeout(() => callback(), 1);
  },
});
dst.on("finish", () => console.log("finish, total:", received));
src.pipe(dst);
