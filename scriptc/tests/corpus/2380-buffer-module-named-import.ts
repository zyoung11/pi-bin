// The module spelling of the Buffer global: `import { Buffer } from
// "node:buffer"` resolves through the import alias to the SAME stdlib
// symbol the bare-global lowerings answer for (the pattern's source graph
// carries third-party .d.ts files that import the name this way).
import { Buffer } from "node:buffer";

const b: Buffer = Buffer.from("héllo", "utf8");
console.log(b.toString("hex"));
console.log(b.length, b.readUInt8(0), b.subarray(1, 3).toString("utf8"));
const c = Buffer.alloc(4, 7);
console.log(c.readUInt32BE(0), Buffer.byteLength("héllo"), Buffer.isEncoding("utf8"));
console.log(Buffer.concat([b, c]).length, Buffer.compare(b, c));
