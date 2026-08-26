// for-await over readables (the async-iterator surface): chunks are
// checked-dynamic (Buffers by tag; .length, [i], toString() and the
// `as Buffer` cast all work), buffered content delivers concatenated
// (Node's iterator read()), a mid-iteration destroy(err) rejects the
// await (caught by the loop's try), and Readable.from arrays deliver
// one WHOLE chunk per element.
import { Readable } from "node:stream";

async function main(): Promise<void> {
  const r = new Readable({ read() {} });
  r.push("one ");
  r.push("two");
  r.push(null);
  for await (const chunk of r) {
    console.log("chunk:", chunk.toString(), chunk.length, typeof chunk);
    console.log("cast:", (chunk as Buffer).toString("utf8"));
  }
  console.log("after:", r.readableEnded, r.destroyed);

  const f = Readable.from(["a", "bc"]);
  console.log("objectMode:", f.readableObjectMode, "hwm:", f.readableHighWaterMark);
  let all = "";
  for await (const chunk of f) all += chunk;
  console.log("from:", all);

  const buffers = Readable.from([Buffer.from([1, 2]), Buffer.from([3])]);
  for await (const chunk of buffers) {
    console.log("bytes:", chunk.length, chunk[0]);
  }

  // one whole chunk per single string/Buffer source (Node's special case)
  for await (const chunk of Readable.from("whole")) {
    console.log("single:", chunk.toString());
  }

  // a slow producer: chunks arrive across timer turns
  let n = 0;
  const slow = new Readable({
    read() {
      n++;
      if (n <= 2) setTimeout(() => this.push(`t${n} `), 1);
      else this.push(null);
    },
  });
  for await (const chunk of slow) console.log("slow:", chunk.toString());

  const e = new Readable({ read() {} });
  setTimeout(() => e.destroy(new Error("mid-iter")), 5);
  try {
    for await (const chunk of e) console.log("never:", chunk.length);
  } catch (err) {
    console.log("caught:", (err as Error).message);
  }
  console.log("done");
}
main();
