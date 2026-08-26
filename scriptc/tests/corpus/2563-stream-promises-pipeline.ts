// stream/promises.pipeline — the promise form over stream stages: the
// same chaining/destroyer semantics as the callback form, settling a
// void promise after the LAST 'close' (fulfilled on success, rejected
// with the first error — every other stage destroyed with the SAME
// error, no unhandled-'error' crash).
import { Readable, Writable, PassThrough, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

async function main(): Promise<void> {
  // Success: source -> passthrough -> sink, resolution after the sink
  // closes (the write order is fully drained first).
  let n = 0;
  const src = new Readable({
    read() {
      n++;
      this.push(n <= 3 ? `p${n}` : null);
    },
  });
  const mid = new PassThrough();
  const out: string[] = [];
  const dst = new Writable({
    write(chunk: Buffer, _enc: string, cb: () => void) {
      out.push(chunk.toString());
      cb();
    },
  });
  await pipeline(src, mid, dst);
  console.log("ok:", out.join(","));

  // Error: a throwing transform rejects the promise with ITS error and
  // tears the other stages down; the rejection is catchable like any
  // awaited promise.
  const s = new Readable({
    read() {
      this.push("x");
    },
  });
  const t = new Transform({
    transform(_chunk: Buffer, _enc: string, cb: (err?: Error | null) => void) {
      cb(new Error("boom"));
    },
  });
  const w = new Writable({
    write(_c: Buffer, _e: string, cb: () => void) {
      cb();
    },
  });
  let closes = 0;
  const bump = (): void => {
    closes++;
  };
  s.on("close", bump);
  t.on("close", bump);
  w.on("close", bump);
  try {
    await pipeline(s, t, w);
    console.log("SHOULD NOT PRINT");
  } catch (e) {
    if (e instanceof Error) console.log("rejected:", e.message);
  }
  console.log("closes:", closes);
}

void main();
