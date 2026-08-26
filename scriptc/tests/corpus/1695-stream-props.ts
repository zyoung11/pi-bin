// The property surface across the lifecycle: readable/writable flags,
// lengths, high-water marks, flowing, ended/finished, objectMode answers
// (statically false — objectMode construction fences), and corked counts.
import { PassThrough, Readable, Writable } from "node:stream";

const r = new Readable({ highWaterMark: 32, read() {} });
console.log("r0:", r.readable, r.readableEnded, r.readableLength, r.readableHighWaterMark, String(r.readableFlowing), r.readableObjectMode, r.destroyed);
r.push("abcdef");
console.log("r1:", r.readableLength);
r.on("end", () => console.log("r end:", r.readable, r.readableEnded));
r.on("data", () => {});
r.push(null);

const w = new Writable({ highWaterMark: 5, write(c, e, cb) { cb(); } });
console.log("w0:", w.writable, w.writableEnded, w.writableFinished, w.writableLength, w.writableHighWaterMark, w.writableObjectMode, w.writableCorked);
w.cork();
w.cork();
w.write("abc");
console.log("w corked:", w.writableCorked, w.writableLength);
w.uncork();
w.uncork();
console.log("w uncorked:", w.writableCorked, w.writableLength);
w.on("finish", () => console.log("w finish:", w.writable, w.writableEnded, w.writableFinished));
w.end();

const pt = new PassThrough();
console.log("pt:", pt.readable, pt.writable, pt.allowHalfOpen);
