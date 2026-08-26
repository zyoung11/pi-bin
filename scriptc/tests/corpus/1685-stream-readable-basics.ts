// @exit: 1
// node:stream Readable basics (exits 1: the push-after-EOF error finds
// no 'error' listener and crashes, after the buffered data delivers): the options-object constructor, buffered
// pushes before listeners, on('data') starting flow on a TICK (synchronous
// code after the registration runs before the first 'data'), chunk
// boundaries preserved, and the 'end' → autoDestroy → 'close' tail.
import { Readable } from "node:stream";

const r = new Readable({ read() {} });
console.log("push1:", r.push("hello "));
console.log("push2:", r.push(Buffer.from("world")));
r.on("data", (chunk: Buffer) => console.log("data:", chunk.toString(), chunk.length));
r.on("end", () => console.log("end"));
r.on("close", () => console.log("close"));
console.log("sync tail:", r.readableLength, String(r.readableFlowing));
r.push(null);
console.log("after eof push:", r.push("late"));
