// Callback-shape relaxations: expression-body arrow option callbacks
// (read: () => this-free push through a captured binding), union-typed
// chunks (push(more ? s : null) — the generator idiom), and listeners
// whose expression bodies return values (Node ignores listener returns).
import { Readable, Writable } from "node:stream";

const parts = ["alpha", "beta", "gamma"];
let i = 0;
const r = new Readable({ read: () => r.push(i < parts.length ? parts[i++]! : null) });
const got: string[] = [];
r.on("data", (c: Buffer) => got.push(c.toString()));
r.on("end", () => console.log("end:", got.join("|")));

const w = new Writable({
  write(chunk, enc, cb) {
    console.log("w:", chunk.toString());
    cb();
  },
});
let count = 0;
w.on("finish", () => (count = count + 100));
w.write(Buffer.from("bin"));
const tail: string | null = "tail-str";
w.write(tail !== null ? tail : Buffer.from("never"));
w.end(() => console.log("finished, count:", count));
console.log("sync");
