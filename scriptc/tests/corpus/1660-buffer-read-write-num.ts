// The Buffer numeric read/write families: every fixed width in both
// endiannesses, the variable-width read/writeUIntLE quartet, and Node's
// exact RangeError ladders (value range before offset, "an integer" for
// fractional indices, ERR_BUFFER_OUT_OF_BOUNDS for too-short buffers,
// underscore separators — with Node's own exponent-form quirk — on big
// Received values).

const caught = (fn: () => number): void => {
  try {
    console.log("ok", fn());
  } catch (e) {
    console.log("caught:", (e as Error).name);
    console.log((e as Error).message);
  }
};

// Fixed-width round trips, both endians.
const b = Buffer.alloc(8);
console.log(b.writeUInt8(0xfe, 0), b.readUInt8(0));
console.log(b.writeInt8(-2, 1), b.readInt8(1), b.readUInt8(1));
console.log(b.writeUInt16BE(0xbeef, 2), b.readUInt16BE(2), b.readUInt16LE(2));
console.log(b.writeUInt16LE(0xbeef, 2), b.readUInt16LE(2), b.readUInt16BE(2));
console.log(b.writeInt16BE(-2, 4), b.readInt16BE(4), b.readUInt16BE(4));
console.log(b.writeInt16LE(-259, 4), b.readInt16LE(4));
console.log(b.writeUInt32BE(3735928559, 0), b.readUInt32BE(0), b.readUInt32LE(0));
console.log(b.writeUInt32LE(3735928559, 0), b.readUInt32LE(0), b.readInt32LE(0));
console.log(b.writeInt32BE(-559038737, 0), b.readInt32BE(0), b.readUInt32BE(0));
console.log(b.writeInt32LE(-2, 4), b.readInt32LE(4));
console.log(b.toString("hex"));

// Omitted offsets default to 0.
console.log(b.writeUInt16BE(258), b.readUInt16BE());
console.log(b.readUInt8(), b.readInt8(), b.readInt16BE(), b.readInt32LE());

// Fractional in-range values truncate on write (no throw) — Node's
// typed-array coercion; NaN passes the range gate and writes zeros.
console.log(b.writeUInt32BE(1.9, 0), b.readUInt32BE(0));
console.log(b.writeInt8(-1.5, 0), b.readInt8(0), b.readUInt8(0));
console.log(b.writeUInt16LE(0 / 0, 0), b.readUInt16LE(0));

// Floats and doubles: rounding, byte layouts, 0 / 0 payloads, -0 sign.
const f = Buffer.alloc(8);
console.log(f.writeFloatBE(1.1, 0), f.toString("hex", 0, 4), f.readFloatBE(0));
console.log(f.writeFloatLE(1.1, 4), f.toString("hex", 4, 8), f.readFloatLE(4));
console.log(f.writeDoubleBE(1.5, 0), f.toString("hex"), f.readDoubleBE(0));
console.log(f.writeDoubleLE(-0.25, 0), f.toString("hex"), f.readDoubleLE(0));
console.log(f.writeFloatLE(-0, 0), f.toString("hex", 0, 4));
console.log(f.writeDoubleBE(0 / 0, 0), f.toString("hex"));
console.log(f.writeFloatBE(0 / 0, 0), f.toString("hex", 0, 4));
console.log(f.writeDoubleLE(1 / 0, 0), f.toString("hex"), f.readDoubleLE(0));

// The variable-width quartet: widths 1-6, sign extension, both endians.
const v = Buffer.from("0102030405060708", "hex");
console.log(v.readUIntBE(1, 5), v.readUIntLE(1, 5));
console.log(v.readIntBE(0, 6), v.readIntLE(2, 6));
console.log(v.readUIntBE(7, 1), v.readIntLE(7, 1));
const w = Buffer.alloc(6);
console.log(w.writeUIntBE(4328719365, 0, 5), w.toString("hex"));
console.log(w.writeUIntLE(4328719365, 0, 5), w.toString("hex"));
console.log(w.writeIntLE(-1, 0, 6), w.toString("hex"), w.readIntLE(0, 6));
console.log(w.writeIntBE(-140737488355328, 0, 6), w.toString("hex"), w.readIntBE(0, 6));
console.log(w.writeIntBE(-2, 0, 3), w.toString("hex", 0, 3), w.readIntBE(0, 3), w.readUIntBE(0, 3));

// Sign-extension edges read back from raw bytes.
const s = Buffer.from("80818283848586", "hex");
console.log(s.readIntBE(0, 3), s.readIntLE(0, 3), s.readUIntBE(0, 3));
console.log(s.readInt8(0), s.readInt16BE(0), s.readInt16LE(0), s.readInt32BE(0));

// The error ladders. Offset: fractional → "an integer", too-short buffer
// → the constant bounds text, otherwise the >= 0 and <= max render.
caught(() => b.readUInt16BE(7));
caught(() => b.readUInt16BE(1.5));
caught(() => b.readUInt16BE(0 / 0));
caught(() => b.readUInt16BE(-1));
caught(() => Buffer.alloc(1).readUInt16BE(0));
caught(() => Buffer.alloc(0).readUInt8(0));
caught(() => Buffer.alloc(3).readFloatBE(0));
caught(() => Buffer.alloc(4).readDoubleBE(0));
caught(() => b.readDoubleLE(1));
caught(() => b.writeFloatBE(1, 5));
caught(() => b.writeFloatBE(1, 1.5));
caught(() => b.writeDoubleLE(1, 7));

// Value gates: range before offset, signed and unsigned renders, the
// "2 ** N" form past 4 bytes, and separator formatting on big values.
caught(() => b.writeUInt8(256, 99));
caught(() => b.writeUInt8(-1, 0));
caught(() => b.writeInt8(-129, 0));
caught(() => b.writeInt8(128, 0));
caught(() => b.writeUInt16LE(65536, 0));
caught(() => b.writeInt16BE(-32769, 0));
caught(() => b.writeUInt32BE(4294967296, 0));
caught(() => b.writeInt32LE(2147483648, 0));
caught(() => b.writeUInt16BE(-0.5, 0));
caught(() => b.writeUInt16BE(1 / 0, 0));
caught(() => w.writeUIntLE(1099511627776, 0, 5));
caught(() => w.writeIntLE(549755813888, 0, 5));
caught(() => w.writeIntLE(-549755813889, 0, 5));
caught(() => w.writeUIntBE(281474976710656, 0, 6));

// byteLength gate: 1-6, integers only, checked before value and offset.
caught(() => v.readUIntLE(0, 7));
caught(() => v.readUIntLE(0, 0));
caught(() => v.readUIntLE(0, 2.5));
caught(() => v.readUIntLE(1.5, 7));
caught(() => w.writeUIntLE(1099511627776, 0, 7));
caught(() => v.readIntBE(7, 2));

// Received renders: separators past 2^32 (strictly), Node's exponent-form
// quirks included, and the plain spelling at the boundary.
caught(() => b.readUInt16BE(4294967296));
caught(() => b.readUInt16BE(4294967297));
caught(() => b.readUInt16BE(-4294967297));
caught(() => b.readUInt16BE(9007199254740992));
caught(() => b.readUInt16BE(1e21));
caught(() => b.readUInt16BE(1e300));
caught(() => b.readUInt16BE(1 / 0));
caught(() => b.readUInt16BE(-1 / 0));
