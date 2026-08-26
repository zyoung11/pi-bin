// String-chunk mode (setEncoding / the encoding option): 'data' delivers
// strings, buffered bytes re-decode at setEncoding (length re-counts in
// string units), split multi-byte sequences hold in the decoder until
// completed, the decoder tail flushes at EOF, and hex decodes too.
import { Readable, Writable } from "node:stream";

// Buffered content converts at setEncoding; lengths count string units.
const r = new Readable({ read() {} });
r.push("hello ");
r.push(Buffer.from("wörld"));
r.setEncoding("utf8");
console.log("len after setEncoding:", r.readableLength);
r.on("data", (chunk: string) => console.log("data:", JSON.stringify(chunk)));
r.on("end", () => console.log("end"));
// split a multi-byte char across pushes: held until completed
const euro = Buffer.from("€");
r.push(euro.subarray(0, 1));
console.log("len mid-char:", r.readableLength);
r.push(euro.subarray(1));
r.push(null);
console.log("sync end");

// The encoding OPTION at construction (Node builds the decoder up front).
const o = new Readable({ encoding: "utf8", read() {} });
o.on("data", (chunk: string) => console.log("opt:", chunk));
o.on("end", () => console.log("opt end"));
o.push(Buffer.from("abc"));
o.push(null);

// hex: every encoding the StringDecoder machinery carries works.
const h = new Readable({ read() {} });
h.setEncoding("hex");
h.on("data", (chunk: string) => console.log("hex:", chunk));
h.push(Buffer.from([0xde, 0xad, 0xbe, 0xef]));
h.push(null);

// An encoded source still pipes bytes-exactly into a Writable.
const src = new Readable({ read() {} });
src.setEncoding("utf8");
const dst = new Writable({
  write(chunk: Buffer, encoding: string, callback: () => void): void {
    console.log("piped:", chunk.toString());
    callback();
  },
});
src.pipe(dst);
src.push("piped-bytes");
src.push(null);
