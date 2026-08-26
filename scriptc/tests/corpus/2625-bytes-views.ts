// Typed-array/Buffer VIEW semantics: subarray() and Buffer's slice()
// alias the receiver's storage (mutations visible both ways — Node swaps
// buffers in place through slice views), plain typed arrays' slice()
// copies, views of views compose their offsets against the one owner,
// Buffer.from(x.buffer, byteOffset?, length?) shares storage, and
// TypedArray.prototype.fill fills per element with JS-exact coercion.
// Node is the oracle.

// ── Buffer.slice / Buffer.subarray are views ──────────────────────────
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7]);
const bslice = buf.slice(1, 5);
bslice[0] = 99;
console.log("slice-aliases", buf[1], bslice.length, buf.toString("hex"));
buf[2] = 88;
console.log("parent-into-slice", bslice[1]);
const bsub = buf.subarray(2, 6);
bsub[3] = 77;
console.log("subarray-aliases", buf[5], bsub.length);

// In-place swap through a slice window — the buffer-swap shape.
const sw = Buffer.from([1, 2, 3, 4, 5, 6, 7]);
sw.slice(1, 5).swap32();
console.log("swap-through-slice", sw.toString("hex"));
sw.slice(1, 5).swap16();
console.log("swap16-through-slice", sw.toString("hex"));

// View of a view: offsets compose against the ONE owner. byteOffset is
// printed RELATIVE to buf's (Node pools small Buffers, so the absolute
// offset is allocator-dependent there).
const inner = bslice.subarray(1, 3);
inner[0] = 42;
console.log("nested-view", buf[2], inner.byteOffset - buf.byteOffset, bslice.byteOffset - buf.byteOffset);

// Clamping: negative indices from the end, past-end clamps, reversed is
// empty — all without throwing.
const cl = Buffer.from([10, 20, 30, 40]);
console.log("clamp-neg", cl.slice(-3, -1).toString("hex"));
console.log("clamp-past", cl.subarray(2, 99).toString("hex"));
console.log("clamp-rev", cl.subarray(3, 1).length);

// ── typed arrays: subarray aliases, slice copies ──────────────────────
const u8 = new Uint8Array([1, 2, 3, 4]);
const u8sub = u8.subarray(1, 3);
u8sub[0] = 200;
console.log("u8-subarray-aliases", u8[1]);
const u8copy = u8.slice(1, 3);
u8copy[0] = 111;
console.log("u8-slice-copies", u8[1], u8copy[0]);

const u32 = new Uint32Array(4);
u32[0] = 0x01020304;
u32[1] = 0x05060708;
const u32sub = u32.subarray(0, 2);
u32sub[1] = 0x0a0b0c0d;
console.log("u32-subarray-aliases", u32[1], u32sub.length);

// ── Buffer.from(x.buffer, byteOffset?, length?) shares storage ────────
const src = new Uint32Array(2);
src.fill(0x04030201);
const over = Buffer.from(src.buffer);
console.log("from-buffer", over.length, over.toString("hex"));
over.swap16();
console.log("from-buffer-swapped", src[0], src[1]);
const window = Buffer.from(src.buffer, 2, 4);
window[0] = 0xff;
console.log("from-buffer-window", window.length, over.toString("hex"));

// A Buffer view over a u8 typed array's storage, offset by byteOffset.
const raw = new Uint8Array([9, 8, 7, 6, 5]);
const rawBuf = Buffer.from(raw.buffer, raw.byteOffset);
rawBuf[4] = 55;
console.log("from-u8-buffer", raw[4], rawBuf.length);

// ── TypedArray.prototype.fill (per element, coercing) ─────────────────
const f = new Uint32Array(5);
console.log("fill-chain", f.fill(7).length, f[0], f[4]);
f.fill(0x1_0000_0002, 1, 3); // wraps mod 2^32
console.log("fill-wrap", f[0], f[1], f[2], f[3]);
f.fill(3, -2); // negative start from the end
console.log("fill-neg", f[2], f[3], f[4]);
const i32 = new Int32Array(2);
i32.fill(-5.9); // truncates toward zero
console.log("fill-i32", i32[0], i32[1]);
const f32 = new Float32Array(2);
f32.fill(1.5);
console.log("fill-f32", f32[0], f32[1]);
// Filling a subarray view writes through to the owner.
u32.subarray(2, 4).fill(0xdead);
console.log("fill-through-view", u32[2], u32[3]);
