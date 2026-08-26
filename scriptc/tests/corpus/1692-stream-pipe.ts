// pipe(): the synchronous 'pipe' event on the destination, data flowing
// src → transform → sink, end propagation (and { end: false } withholding
// it), and unpipe's 'unpipe' event.
import { PassThrough, Readable, Writable } from "node:stream";

const src = new Readable({ read() {} });
const mid = new PassThrough();
const sink = new Writable({
  write(chunk, enc, cb) {
    console.log("sink:", chunk.toString());
    cb();
  },
});
mid.on("pipe", () => console.log("mid got pipe"));
sink.on("pipe", () => console.log("sink got pipe"));
sink.on("finish", () => console.log("sink finish"));
mid.on("unpipe", () => console.log("mid unpiped"));
src.pipe(mid).pipe(sink);
src.push("first");
src.push(null);
mid.on("end", () => {
  console.log("mid end");
  src.unpipe(mid);
});
console.log("tail");
