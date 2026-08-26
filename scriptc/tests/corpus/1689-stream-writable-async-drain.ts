// Asynchronous write completion: a queued second write, 'drain' after the
// buffer empties past a false write() answer, and per-write callbacks in
// completion order.
import { Writable } from "node:stream";

let cbA: ((error?: Error | null) => void) | null = null;
let cbB: ((error?: Error | null) => void) | null = null;
const w = new Writable({
  highWaterMark: 4,
  write(chunk, encoding, callback) {
    console.log("write:", chunk.toString());
    if (cbA === null) cbA = callback;
    else cbB = callback;
  },
});
w.on("drain", () => console.log("drain, length:", w.writableLength));
console.log("a:", w.write("aaa", () => console.log("cb a")));
console.log("b:", w.write("bbbb", () => console.log("cb b")));
console.log("queued:", w.writableLength);
setTimeout(() => {
  console.log("t1: complete a");
  cbA!();
  console.log("after a:", w.writableLength);
  setTimeout(() => {
    console.log("t2: complete b");
    cbB!();
    console.log("after b:", w.writableLength);
  }, 5);
}, 5);
