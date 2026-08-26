// DataView bounds discipline: every failure mode throws Node's catchable
// RangeError with Node's exact message — constructor offsets and lengths
// (ToIndex, NaN → 0, truncation, Infinity), getter offsets on every width,
// and the ok-cases right at the edges. Node is the oracle.

function caught(label: string, fn: () => number): void {
  try {
    console.log(label, "ok", fn());
  } catch (e) {
    if (e instanceof RangeError) {
      console.log(label, "RangeError:", e.message);
    } else {
      console.log(label, "unexpected");
    }
  }
}

const buf = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

// Constructor offset: fractional truncates, NaN is 0, negative / past-end
// / huge / Infinity all throw the ONE Node message.
caught("off-frac", () => new DataView(buf.buffer, 2.9).byteLength);
caught("off-nan", () => new DataView(buf.buffer, 0 / 0).byteLength);
caught("off-end", () => new DataView(buf.buffer, 8).byteLength);
caught("off-neg", () => new DataView(buf.buffer, -1).byteLength);
caught("off-past", () => new DataView(buf.buffer, 9).byteLength);
caught("off-huge", () => new DataView(buf.buffer, 9007199254740992).byteLength);
caught("off-inf", () => new DataView(buf.buffer, 1 / 0).byteLength);

// Constructor length: explicit 0 and NaN are empty views, fractional
// truncates, overflow / negative / Infinity throw.
caught("len-zero", () => new DataView(buf.buffer, 3, 0).byteLength);
caught("len-nan", () => new DataView(buf.buffer, 3, 0 / 0).byteLength);
caught("len-frac", () => new DataView(buf.buffer, 3, 4.9).byteLength);
caught("len-edge", () => new DataView(buf.buffer, 3, 5).byteLength);
caught("len-over", () => new DataView(buf.buffer, 3, 6).byteLength);
caught("len-neg", () => new DataView(buf.buffer, 0, -1).byteLength);
caught("len-inf", () => new DataView(buf.buffer, 0, 1 / 0).byteLength);

// Getter offsets: each width right at its edge and one past, negative,
// NaN-as-zero, fractional truncation — the constant Node message.
const v = new DataView(buf.buffer, 2, 5); // bytes 3..7
caught("g8-edge", () => v.getUint8(4));
caught("g8-past", () => v.getUint8(5));
caught("g8-neg", () => v.getUint8(-1));
caught("g8-nan", () => v.getUint8(0 / 0));
caught("g8-frac", () => v.getUint8(4.7));
caught("g16-edge", () => v.getUint16(3));
caught("g16-past", () => v.getUint16(4));
caught("g32-edge", () => v.getUint32(1));
caught("g32-past", () => v.getUint32(2));
caught("gi32", () => v.getInt32(1, true));
caught("gf32-past", () => v.getFloat32(2));
caught("gf64-past", () => v.getFloat64(0));
caught("gbig-past", () => Number(v.getBigUint64(0)));

const whole = new DataView(buf.buffer);
caught("gf64-edge", () => whole.getFloat64(0, true));
caught("gbig-edge", () => Number(whole.getBigUint64(0, true)));

// A view over a view's .buffer resolves to the SAME buffer: offsets stay
// absolute exactly like JS, and the bounds are the owner's.
const inner = new DataView(v.buffer, 6, 2);
console.log("rebased", inner.byteOffset, inner.byteLength, inner.getUint8(0), inner.getUint16(0));
caught("rebase-past", () => new DataView(v.buffer, 6, 3).byteLength);

// The empty edge: zero-length buffers and views.
const empty = new Uint8Array(0);
caught("empty", () => new DataView(empty.buffer).byteLength);
caught("empty-get", () => new DataView(empty.buffer).getUint8(0));

// byteOffset/byteLength are the view's own window, not the owner's.
const tail = new Uint8Array([9, 9, 9, 9]);
const tv = new DataView(tail.buffer, 1, 2);
console.log("viewlen", tv.byteLength, tv.byteOffset);
