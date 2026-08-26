// StringDecoder beyond utf8: the encoding property's normalized names,
// utf16le's odd-byte and trailing-lead-surrogate buffering (pair halves
// reassembling across chunk boundaries), base64/base64url's mod-3 groups
// with end() padding, and the stateless latin1/ascii/hex decoders.
import { StringDecoder } from "node:string_decoder";

// The encoding property answers the normalized spelling.
console.log(new StringDecoder().encoding, new StringDecoder("utf-8").encoding);
console.log(new StringDecoder("ucs2").encoding, new StringDecoder("ucs-2").encoding, new StringDecoder("utf-16le").encoding);
console.log(new StringDecoder("binary").encoding, new StringDecoder("latin1").encoding);
console.log(new StringDecoder("base64url").encoding, new StringDecoder("hex").encoding, new StringDecoder("ascii").encoding);

// utf8 across split multi-byte sequences (the pinned baseline).
const u8 = new StringDecoder("utf8");
console.log(JSON.stringify(u8.write(Buffer.from([0xe2, 0x82]))));
console.log(JSON.stringify(u8.write(Buffer.from([0xac, 0x61]))));
console.log(JSON.stringify(u8.end()));

// utf16le: an odd byte buffers; the completed unit joins the next chunk.
const u16 = new StringDecoder("utf16le");
console.log(JSON.stringify(u16.write(Buffer.from("61", "hex"))));
console.log(JSON.stringify(u16.write(Buffer.from("006200", "hex"))));
console.log(JSON.stringify(u16.end()));

// A trailing lead surrogate holds until its trail arrives — split three
// ways, the emoji reassembles.
const p = new StringDecoder("utf16le");
console.log(JSON.stringify(p.write(Buffer.from("61003dd8", "hex"))));
console.log(JSON.stringify(p.write(Buffer.from("00", "hex"))));
console.log(JSON.stringify(p.write(Buffer.from("de6200", "hex"))));
console.log(JSON.stringify(p.end()));

// end() with a buffered odd byte flushes nothing (the byte drops).
const o = new StringDecoder("utf16le");
console.log(JSON.stringify(o.write(Buffer.from("6100 62", "hex"))));
console.log(JSON.stringify(o.end()));
console.log(JSON.stringify(o.write(Buffer.from("61006200", "hex"))));

// base64: complete 3-byte groups emit, the remainder pads at end().
const b = new StringDecoder("base64");
console.log(JSON.stringify(b.write(Buffer.from([1, 2, 3, 4]))));
console.log(JSON.stringify(b.write(Buffer.from([5]))));
console.log(JSON.stringify(b.write(Buffer.from([6, 7, 8, 9, 10]))));
console.log(JSON.stringify(b.end()));
console.log(JSON.stringify(b.write(Buffer.from([1]))), JSON.stringify(b.end()));

// base64url: same grouping, unpadded -_ alphabet.
const bu = new StringDecoder("base64url");
console.log(JSON.stringify(bu.write(Buffer.from([251, 255, 254, 251]))));
console.log(JSON.stringify(bu.end()));

// The stateless trio: write IS toString, end flushes nothing.
const l = new StringDecoder("latin1");
console.log(JSON.stringify(l.write(Buffer.from([104, 233, 128]))), JSON.stringify(l.end()));
const a = new StringDecoder("ascii");
console.log(JSON.stringify(a.write(Buffer.from([104, 233]))), JSON.stringify(a.end()));
const h = new StringDecoder("hex");
console.log(JSON.stringify(h.write(Buffer.from([1, 171, 255]))), JSON.stringify(h.end()));

// Decoders keep working after end() (Node resets the state).
console.log(JSON.stringify(u16.write(Buffer.from("63006400", "hex"))));
