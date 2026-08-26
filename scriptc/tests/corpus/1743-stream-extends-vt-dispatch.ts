// The vtable dispatch behind stream underscore overrides: a base class's
// constructor runs the stream super(), and a further-derived class's
// _write override still wins for derived instances (Node dispatches
// through the prototype chain; here the synthesized wrapper closure
// dispatches through the vt). Also: a derived class NOT overriding keeps
// the base's method, and upcast pipe destinations dispatch dynamically.
import { Readable, Writable } from "node:stream";

class Base extends Writable {
  label = "base";
  constructor() {
    super({ highWaterMark: 8 });
  }
  _write(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void): void {
    console.log(`${this.label}:`, chunk.toString());
    callback();
  }
}
class Loud extends Base {
  _write(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void): void {
    console.log(`${this.label}!`, chunk.toString().toUpperCase());
    callback();
  }
}
class Quiet extends Base {}

const b = new Base();
const l = new Loud();
l.label = "loud";
const q = new Quiet();
q.label = "quiet";
b.write("one");
l.write("two");
q.write("three");

// A base-typed variable holding the derived instance still reaches the
// override (the wrapper dispatches on the DYNAMIC class).
const asBase: Base = new Loud();
asBase.label = "upcast";
asBase.write("four");

// Pipe into an upcast destination: the source sees a Writable; the
// derived _write runs.
class Two extends Readable {
  private n = 0;
  _read(): void {
    this.n++;
    if (this.n <= 2) this.push(`p${this.n}`);
    else this.push(null);
  }
}
const dst: Base = new Loud();
dst.label = "piped";
new Two().pipe(dst);
dst.on("finish", () => console.log("piped finish"));
console.log("sync end");
