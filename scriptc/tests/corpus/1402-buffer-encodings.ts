// Buffer.from(string, encoding) / toString(encoding) round trips: utf8
// (astral pairs, and WHATWG U+FFFD replacement for invalid sequences —
// per maximal subpart, Node-exact), lenient hex and base64 decoding,
// alloc, concat, and the writeUInt32BE/readUInt32BE pair with Node's
// RangeError messages.
const poo = Buffer.from("héllo 💩", "utf8");
console.log("hex", poo.toString("hex"));
console.log("rt", poo.toString("utf8") === "héllo 💩");
console.log("b64", poo.toString("base64"));
console.log("b64rt", Buffer.from(poo.toString("base64"), "base64").toString("hex"));

console.log("default", Buffer.from("hi").toString());
console.log("hexdec", Buffer.from("00ff7f", "hex").toString("base64"));
console.log("hexlenient", Buffer.from("a1g2", "hex").toString("hex"));
console.log("hexodd", Buffer.from("abc", "hex").toString("hex"));
console.log("b64lenient", Buffer.from("aGV s bG8=??", "base64").toString());

// Invalid utf8: surrogate bytes are one replacement PER BYTE, a truncated
// 4-byte lead is ONE replacement (maximal subpart).
console.log("bad1", Buffer.from("eda0bdedb2a9", "hex").toString("utf8"));
console.log("bad2", Buffer.from("f09f92", "hex").toString("utf8"));
console.log("bad3", Buffer.from("41c2", "hex").toString("utf8"));

const z = Buffer.alloc(6);
console.log("alloc", z.length, z[0], z[5]);

const cat = Buffer.concat([Buffer.from("0102", "hex"), new Uint8Array(2), Buffer.from("ff", "hex")]);
console.log("cat", cat.length, cat.toString("hex"));
console.log("cat0", Buffer.concat([]).length);

const w = Buffer.alloc(8);
console.log("w", w.writeUInt32BE(3735928559, 1));
console.log("wbytes", w.toString("hex"));
console.log("r", w.readUInt32BE(1));
console.log("r0", w.readUInt32BE(0));
try {
  w.writeUInt32BE(4294967296, 0);
  console.log("no-throw");
} catch (e) {
  if (e instanceof RangeError) {
    console.log("range1", e.message);
  }
}
try {
  w.writeUInt32BE(1, 5);
  console.log("no-throw");
} catch (e) {
  if (e instanceof RangeError) {
    console.log("range2", e.message);
  }
}
try {
  Buffer.alloc(2).readUInt32BE(0);
  console.log("no-throw");
} catch (e) {
  if (e instanceof RangeError) {
    console.log("range3", e.message);
  }
}
