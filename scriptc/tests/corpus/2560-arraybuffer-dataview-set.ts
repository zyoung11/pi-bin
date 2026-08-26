// Fresh-ArrayBuffer erasure and DataView setters. `new T(new
// ArrayBuffer(n))` and `new DataView(new ArrayBuffer(n), ...)` erase the
// buffer into the view (nothing else can reference it, so aliasing is
// unobservable); the setter family mirrors the getters: JS-exact value
// coercions (modular truncation, double→float rounding), the optional
// littleEndian flag, and Node's one constant RangeError on bad offsets.

// Erasure into every typed-array kind: zero-filled, correct element count.
const u8 = new Uint8Array(new ArrayBuffer(8));
u8[0] = 255;
console.log(u8.length, u8.byteLength, u8[0], u8[7]);
const u32 = new Uint32Array(new ArrayBuffer(16));
u32[3] = 0xdeadbeef;
console.log(u32.length, u32.byteLength, u32[3]);
const i32 = new Int32Array(new ArrayBuffer(8));
i32[1] = -2;
console.log(i32.length, i32[1]);
const f32 = new Float32Array(new ArrayBuffer(12));
f32[2] = 1.5;
console.log(f32.length, f32[2]);
const empty = new Uint8Array(new ArrayBuffer(0));
console.log(empty.length, empty.byteLength);

// DataView over a fresh buffer: zero bytes until written.
const dv = new DataView(new ArrayBuffer(8));
console.log(dv.byteLength, dv.byteOffset, dv.getFloat64(0));

// Setter/getter roundtrips on every width, both endiannesses.
dv.setUint8(0, 0xab);
dv.setInt8(1, -1);
console.log(dv.getUint8(0), dv.getInt8(1), dv.getUint8(1));
dv.setUint16(2, 0xbeef);
console.log(dv.getUint16(2), dv.getUint8(2), dv.getUint8(3));
dv.setUint16(2, 0xbeef, true);
console.log(dv.getUint16(2, true), dv.getUint8(2), dv.getUint8(3));
dv.setInt16(4, -2, false);
console.log(dv.getInt16(4), dv.getUint16(4));
dv.setUint32(4, 0x01020304);
console.log(dv.getUint32(4), dv.getInt32(4), dv.getUint8(7));
dv.setInt32(4, -16, true);
console.log(dv.getInt32(4, true), dv.getUint32(4, true), dv.getUint32(4));
dv.setFloat64(0, 1.5);
console.log(dv.getFloat64(0), dv.getUint8(0), dv.getUint8(1));
dv.setFloat64(0, 1.5, true);
console.log(dv.getFloat64(0, true), dv.getUint8(6), dv.getUint8(7));
dv.setFloat32(4, 1.1);
console.log(dv.getFloat32(4), dv.getFloat64(0, true));

// Value coercions: modular truncation on the integer kinds (NaN and
// ±Infinity store 0), double→float rounding on Float32.
dv.setUint8(0, 257.9);
dv.setUint8(1, -1);
dv.setUint8(2, 0 / 0);
dv.setUint8(3, 1 / 0);
console.log(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
dv.setUint16(0, 65536 + 7);
console.log(dv.getUint16(0));
dv.setInt16(0, -32769);
console.log(dv.getInt16(0));
dv.setUint32(0, 4294967296 + 41);
console.log(dv.getUint32(0));
dv.setFloat32(0, 0.1);
console.log(dv.getFloat32(0));

// Fractional and NaN offsets go through ToIndex like the getters.
dv.setUint8(5.7, 9);
console.log(dv.getUint8(5));
dv.setUint8(0 / 0, 42);
console.log(dv.getUint8(0));

// The offset/length constructor args keep their runtime story, and a
// view over x.buffer aliases x — setters write through.
const backing = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
const win = new DataView(backing.buffer, 2, 4);
win.setUint16(0, 0x0910);
console.log(win.byteLength, win.byteOffset, backing[2], backing[3], backing[4]);
const dvo = new DataView(new ArrayBuffer(8), 6);
console.log(dvo.byteLength, dvo.byteOffset);

// Bad setter offsets: Node's one constant RangeError, catchably.
function caught(label: string, fn: () => void): void {
  try {
    fn();
    console.log(label, "ok");
  } catch (e) {
    if (e instanceof RangeError) console.log(label, "RangeError:", e.message);
    else console.log(label, "unexpected");
  }
}
caught("set-end", () => dv.setUint8(8, 1));
caught("set-neg", () => dv.setUint8(-1, 1));
caught("set-wide", () => dv.setFloat64(1, 1));
caught("set-edge", () => dv.setFloat64(0, 2.5));
caught("set-u32", () => dv.setUint32(5, 1));
caught("set-inf", () => dv.setUint8(1 / 0, 1));
console.log(dv.getFloat64(0));

// Constructor bounds on the fresh-buffer form throw like Node too.
caught("ctor-off", () => { new DataView(new ArrayBuffer(4), 5); });
caught("ctor-len", () => { new DataView(new ArrayBuffer(4), 1, 4); });
