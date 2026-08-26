// stream/consumers — the rejection set: a stream error rejects with THAT
// error, a premature close rejects ERR_STREAM_PREMATURE_CLOSE, and
// malformed accumulated text rejects json() with JSON.parse's
// SyntaxError. Every rejection is catchable at the await.
import { Readable } from "node:stream";
import { buffer, json, text } from "node:stream/consumers";

async function main(): Promise<void> {
  // destroy(err): the consumer rejects with the stream's error.
  const r1 = new Readable({ read() {} });
  const p1 = text(r1);
  r1.push("partial");
  r1.destroy(new Error("mid-stream failure"));
  try {
    await p1;
    console.log("SHOULD NOT PRINT");
  } catch (e) {
    if (e instanceof Error) console.log("text error:", e.message);
  }

  // A bare destroy() before end: Node's premature-close code.
  const r2 = new Readable({ read() {} });
  const p2 = buffer(r2);
  r2.destroy();
  try {
    await p2;
    console.log("SHOULD NOT PRINT");
  } catch (e) {
    if (e instanceof Error) {
      console.log("buffer premature:", `${(e as NodeJS.ErrnoException).code}`);
    }
  }

  // Malformed JSON: the stream ends cleanly, the PARSE rejects.
  const r3 = new Readable({ read() {} });
  const p3 = json(r3);
  r3.push('{"a":');
  r3.push(null);
  try {
    await p3;
    console.log("SHOULD NOT PRINT");
  } catch (e) {
    if (e instanceof Error) console.log("json error:", e.name);
  }

  // An erroring json() source rejects with the STREAM error (the parse
  // never runs).
  const r4 = new Readable({ read() {} });
  const p4 = json(r4);
  r4.destroy(new Error("gone"));
  try {
    await p4;
    console.log("SHOULD NOT PRINT");
  } catch (e) {
    if (e instanceof Error) console.log("json stream error:", e.message);
  }
}

void main();
