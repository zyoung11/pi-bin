// stream.finished — the callback form: fires once right after 'close'
// (the default autoDestroy+emitClose lifecycle), with the error on
// error, ERR_STREAM_PREMATURE_CLOSE when the stream closed before its
// end/finish, and nothing on success. The returned CLEANUP function
// unhooks the callback; a registered watcher also consumes an otherwise
// unhandled 'error' (Node's eos registers its own listeners).
import { Readable, Writable, finished } from "node:stream";

const r1 = new Readable({
  read() {
    this.push(null);
  },
});
finished(r1, (err?: Error | null) => {
  console.log("r1:", err !== undefined && err !== null ? err.message : "clean");
  step2();
});
r1.resume();

function step2(): void {
  const r2 = new Readable({ read() {} });
  finished(r2, (err?: Error | null) => {
    console.log("r2:", err !== undefined && err !== null ? err.message : "clean");
    step3();
  });
  r2.destroy();
}

function step3(): void {
  let fed = false;
  const r3 = new Readable({
    read() {
      if (!fed) {
        fed = true;
        this.push("x");
        this.push(null);
      }
    },
  });
  const cleanup = finished(r3, () => console.log("r3: SHOULD NOT PRINT"));
  cleanup();
  r3.resume();
  r3.on("end", () => {
    console.log("r3: cleanup held");
    step4();
  });
}

function step4(): void {
  const w = new Writable({
    write(chunk: Buffer, enc: string, cb: () => void) {
      cb();
    },
  });
  finished(w, (err?: Error | null) => {
    console.log("w:", err !== undefined && err !== null ? err.message : "clean");
  });
  w.write("data");
  w.end();
}
console.log("sync");
