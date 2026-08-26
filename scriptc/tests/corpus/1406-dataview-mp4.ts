// DataView as real code uses it: mp4-box-style parsing over an in-program
// buffer — the composed `new DataView(buf.buffer, buf.byteOffset + off,
// size)` construction, big-endian defaults, the littleEndian flag, string
// tags via getUint8 + fromCharCode, 64-bit sizes through the composed
// Number(getBigUint64), and views over non-u8 storage. Node is the oracle.

interface Box {
  type: string;
  offset: number;
  size: number;
}

function readBoxHeader(view: DataView, offset: number): Box | null {
  if (offset + 8 > view.byteLength) return null;
  let size = view.getUint32(offset);
  const type = String.fromCharCode(
    view.getUint8(offset + 4),
    view.getUint8(offset + 5),
    view.getUint8(offset + 6),
    view.getUint8(offset + 7)
  );
  if (size === 1) {
    if (offset + 16 > view.byteLength) return null;
    size = Number(view.getBigUint64(offset + 8));
  } else if (size === 0) {
    size = view.byteLength - offset;
  }
  return { type, offset, size };
}

function findBox(view: DataView, start: number, end: number, type: string): Box | null {
  let offset = start;
  while (offset < end) {
    const box = readBoxHeader(view, offset);
    if (!box || box.size < 8) return null;
    if (box.type === type) return box;
    offset += box.size;
  }
  return null;
}

// Build a synthetic file: [ftyp (12 bytes)] [moov (24 bytes) [trak (16 bytes)]]
// then a largesize box using the 64-bit length form.
const file = new Uint8Array(64);
function putU32(at: number, v: number): void {
  file[at] = (v >>> 24) & 0xff;
  file[at + 1] = (v >>> 16) & 0xff;
  file[at + 2] = (v >>> 8) & 0xff;
  file[at + 3] = v & 0xff;
}
function putTag(at: number, tag: string): void {
  for (let i = 0; i < 4; i++) file[at + i] = tag.charCodeAt(i);
}
putU32(0, 12);
putTag(4, "ftyp");
putTag(8, "isom");
putU32(12, 24);
putTag(16, "moov");
putU32(20, 16);
putTag(24, "trak");
putU32(28, 0x01020304);
// largesize box at 36: size=1 marker, then the real 64-bit size (28).
putU32(36, 1);
putTag(40, "mdat");
putU32(44, 0);
putU32(48, 28);

const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
console.log("byteLength", view.byteLength, "byteOffset", view.byteOffset, file.byteOffset);

const ftyp = findBox(view, 0, file.length, "ftyp");
console.log("ftyp", ftyp ? `${ftyp.type},${ftyp.offset},${ftyp.size}` : "none");
const moov = findBox(view, 0, file.length, "moov");
console.log("moov", moov ? `${moov.type},${moov.offset},${moov.size}` : "none");
if (moov) {
  const trak = findBox(view, moov.offset + 8, moov.offset + moov.size, "trak");
  console.log("trak", trak ? `${trak.type},${trak.offset},${trak.size}` : "none");
  // Sub-view relative to the trak payload — the parseAvcC shape.
  if (trak) {
    const sub = new DataView(file.buffer, file.byteOffset + trak.offset + 8, 8);
    console.log("sub", sub.byteLength, sub.byteOffset, sub.getUint32(4));
    console.log("subLE", sub.getUint32(4, true), sub.getUint16(4), sub.getUint16(4, true));
    console.log("subI", sub.getInt32(4), sub.getInt16(4, true), sub.getInt8(7), sub.getUint8(7));
  }
}
const mdat = findBox(view, 36, file.length, "mdat");
console.log("mdat64", mdat ? `${mdat.size}` : "none");

// Aliasing: the view reads the array's CURRENT bytes.
file[28] = 0xff;
console.log("alias", view.getUint32(28), view.getInt32(28));

// Views over non-u8 storage: byte-level access into f32/u32 elements.
const floats = new Float32Array(3);
floats[0] = 1.5;
floats[1] = -2.25;
floats[2] = 6.02e23;
const fview = new DataView(floats.buffer);
console.log("f32", fview.getFloat32(0, true), fview.getFloat32(4, true), fview.getFloat32(8, true));
console.log("f32be", fview.getFloat32(0), fview.getUint32(0, true) === floats.length ? "?" : "ok");
console.log("fbytes", fview.byteLength, fview.byteOffset);

const words = new Uint32Array(2);
words[0] = 0xdeadbeef;
words[1] = 0x01020304;
const wview = new DataView(words.buffer, 4);
console.log("w", wview.byteLength, wview.getUint32(0, true), wview.getUint32(0));

// getFloat64 and the signed big form, both endiannesses.
const dbytes = new Uint8Array(16);
const dview = new DataView(dbytes.buffer);
dbytes[0] = 0x40;
dbytes[1] = 0x09;
dbytes[2] = 0x21;
dbytes[3] = 0xfb;
dbytes[4] = 0x54;
dbytes[5] = 0x44;
dbytes[6] = 0x2d;
dbytes[7] = 0x18;
console.log("pi", dview.getFloat64(0));
for (let i = 0; i < 8; i++) dbytes[8 + i] = 0xff;
console.log("bigs", Number(dview.getBigUint64(8)), Number(dview.getBigInt64(8)), Number(dview.getBigInt64(8, true)));
