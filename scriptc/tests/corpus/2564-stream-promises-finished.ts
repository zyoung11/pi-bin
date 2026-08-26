// stream/promises.finished — the promise form of the terminal watcher:
// fulfilled once the stream closes cleanly (right after 'close', the
// callback form's timing), rejected with the stream's error, and
// rejected with ERR_STREAM_PREMATURE_CLOSE when the stream closed
// before its end/finish.
import { Readable, Writable } from "node:stream";
import { finished } from "node:stream/promises";

async function main(): Promise<void> {
  // Clean end: the readable drains and closes; the promise fulfills.
  const r1 = new Readable({
    read() {
      this.push(null);
    },
  });
  const done1 = finished(r1);
  r1.resume();
  await done1;
  console.log("r1: clean");

  // Errored: destroy(err) rejects with that error.
  const r2 = new Readable({ read() {} });
  const done2 = finished(r2);
  r2.destroy(new Error("torn"));
  try {
    await done2;
    console.log("SHOULD NOT PRINT");
  } catch (e) {
    if (e instanceof Error) console.log("r2:", e.message);
  }

  // Premature close: a bare destroy() before end rejects with Node's
  // ERR_STREAM_PREMATURE_CLOSE.
  const r3 = new Readable({ read() {} });
  const done3 = finished(r3);
  r3.destroy();
  try {
    await done3;
    console.log("SHOULD NOT PRINT");
  } catch (e) {
    if (e instanceof Error) {
      console.log("r3:", `${(e as NodeJS.ErrnoException).code}`, "/", e.message);
    }
  }

  // The writable side: end() finishes cleanly after the queued write.
  const w = new Writable({
    write(_chunk: Buffer, _enc: string, cb: () => void) {
      cb();
    },
  });
  const done4 = finished(w);
  w.write("data");
  w.end();
  await done4;
  console.log("w: clean");
}

void main();
