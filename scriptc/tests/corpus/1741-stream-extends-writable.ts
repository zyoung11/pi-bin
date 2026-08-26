// `extends Writable` with _write/_final/_destroy overrides: the write
// path calls the override synchronously, _final runs before 'finish',
// _destroy observes the destroy error, and end(cb) ordering matches
// Node (end callbacks before 'finish', autoDestroy then 'close').
import { Writable } from "node:stream";

class Sink extends Writable {
  chunks: string[] = [];
  constructor() {
    super({ highWaterMark: 8 });
  }
  _write(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void): void {
    this.chunks.push(chunk.toString());
    console.log("write:", chunk.toString(), encoding);
    callback();
  }
  _final(callback: (error?: Error | null) => void): void {
    console.log("final, buffered:", this.chunks.join("|"));
    callback();
  }
}

const w = new Sink();
console.log("instanceof Writable:", w instanceof Writable);
console.log("ret small:", w.write("ab"));
console.log("ret big:", w.write("0123456789"));
w.on("prefinish", () => console.log("prefinish"));
w.on("finish", () => console.log("finish"));
w.on("close", () => console.log("close"));
w.end("tail", () => console.log("end cb"));
console.log("sync end; ended =", w.writableEnded);

class Doomed extends Writable {
  _write(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void): void {
    callback();
  }
  _destroy(err: Error | null, callback: (error?: Error | null) => void): void {
    console.log("destroy sees:", err === null ? "null" : err.message);
    callback();
  }
}
const d = new Doomed();
d.on("error", (e: Error) => console.log("error:", e.message));
d.on("close", () => console.log("doomed close"));
d.destroy(new Error("boom"));
console.log("destroyed:", d.destroyed);
