// Writable basics: the write(chunk, enc, cb) option signature (encoding is
// 'buffer' under decodeStrings), the below-hwm answer computed AFTER a
// synchronous completion, needDrain, end(chunk, cb) with the callback
// running before 'finish' listeners, and finish → autoDestroy → 'close'.
import { Writable } from "node:stream";

const w = new Writable({
  highWaterMark: 8,
  write(chunk, encoding, callback) {
    console.log("write:", chunk.toString(), encoding);
    callback();
  },
  final(callback) {
    console.log("final");
    callback();
  },
});
w.on("finish", () => console.log("finish"));
w.on("prefinish", () => console.log("prefinish"));
w.on("close", () => console.log("close"));
console.log("w1:", w.write("abc"));
console.log("w2:", w.write(Buffer.from("defgh")));
console.log("state:", w.writableLength, w.writableNeedDrain, w.writableHighWaterMark);
w.end("tail", () => console.log("end cb"));
console.log("sync:", w.writableEnded, w.writableFinished);
