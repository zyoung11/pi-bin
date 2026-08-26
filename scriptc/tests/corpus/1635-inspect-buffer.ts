// util.inspect over Buffers: the <Buffer aa bb ..> hex form, the
// 50-byte INSPECT_MAX_BYTES cap with its "... N more bytes" tail (and
// the singular form at exactly one over), the empty "<Buffer >" form,
// and full rendering at any depth (Buffer's custom inspect runs before
// the depth check). Node is the oracle byte-for-byte.
import { inspect } from "node:util";

console.log(inspect(Buffer.alloc(0)));
console.log(inspect(Buffer.from([0])));
console.log(inspect(Buffer.from([0xab])));
console.log(inspect(Buffer.from([1, 2, 171, 255, 0, 16])));
console.log(inspect(Buffer.from("hello utf8 ✓", "utf8")));

const bytes50: number[] = [];
for (let i = 0; i < 50; i++) bytes50.push(0xff);
console.log(inspect(Buffer.from(bytes50)));
bytes50.push(0xff);
console.log(inspect(Buffer.from(bytes50)));
bytes50.push(0xff);
console.log(inspect(Buffer.from(bytes50)));
const bytes200: number[] = [];
for (let i = 0; i < 200; i++) bytes200.push(7);
console.log(inspect(Buffer.from(bytes200)));

// depth never truncates a Buffer at the top level
console.log(inspect(Buffer.from([1, 2, 3]), { depth: -1 }));
console.log(inspect(Buffer.from([1, 2, 3]), { depth: 0 }));
