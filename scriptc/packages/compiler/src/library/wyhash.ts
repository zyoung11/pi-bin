/* Wyhash-64 (final_version_3) over BigInt — the sidecar schema's one
 * worked hashing definition. Both identity values the contract sidecar
 * carries ride this function:
 *
 *   - `build_id`: seed 0xb11d1d00 over the length-prefixed stream of
 *     (compiler version, profile bytes, sorted module graph) — the
 *     build-pairing fence, deliberately compiler-release-salted.
 *   - `source_hash` under the "module-graph" contract: seed 0xc0de5eed
 *     over the length-prefixed sorted module graph alone — the freshness
 *     hash, deliberately stable across compiler releases for identical
 *     sources.
 *
 * Every variable-length input is length-prefixed (u64 little-endian byte
 * count, then the bytes) so no concatenation of inputs is ambiguous; the
 * hash runs once over the whole framed stream. Determinism is the entire
 * point: no clock, no environment, no machine identity anywhere near the
 * inputs. */

const MASK64 = (1n << 64n) - 1n;
const P0 = 0xa0761d6478bd642fn;
const P1 = 0xe7037ed1a0b428dbn;
const P2 = 0x8ebc6af09c88c6e3n;
const P3 = 0x589965cc75374cc3n;

/** 64x64→128 multiply, xor-folded (wyhash's _wymix). */
function wymix(a: bigint, b: bigint): bigint {
  const r = (a & MASK64) * (b & MASK64);
  return ((r & MASK64) ^ (r >> 64n)) & MASK64;
}

function wyr8(d: Uint8Array, o: number): bigint {
  let v = 0n;
  for (let i = 7; i >= 0; i--) v = (v << 8n) | BigInt(d[o + i]!);
  return v;
}

function wyr4(d: Uint8Array, o: number): bigint {
  return BigInt(d[o]! | (d[o + 1]! << 8) | (d[o + 2]! << 16)) | (BigInt(d[o + 3]!) << 24n);
}

function wyr3(d: Uint8Array, o: number, k: number): bigint {
  return BigInt((d[o]! << 16) | (d[o + (k >> 1)]! << 8) | d[o + k - 1]!);
}

/** wyhash final_version_3 of `data` under `seed` — a u64. */
export function wyhash64(data: Uint8Array, seed: bigint): bigint {
  const len = data.length;
  seed = (seed ^ P0) & MASK64;
  let a: bigint;
  let b: bigint;
  if (len <= 16) {
    if (len >= 4) {
      a = (wyr4(data, 0) << 32n) | wyr4(data, (len >> 3) << 2);
      b = (wyr4(data, len - 4) << 32n) | wyr4(data, len - 4 - ((len >> 3) << 2));
    } else if (len > 0) {
      a = wyr3(data, 0, len);
      b = 0n;
    } else {
      a = 0n;
      b = 0n;
    }
  } else {
    let i = len;
    let p = 0;
    if (i > 48) {
      let see1 = seed;
      let see2 = seed;
      do {
        seed = wymix(wyr8(data, p) ^ P1, wyr8(data, p + 8) ^ seed);
        see1 = wymix(wyr8(data, p + 16) ^ P2, wyr8(data, p + 24) ^ see1);
        see2 = wymix(wyr8(data, p + 32) ^ P3, wyr8(data, p + 40) ^ see2);
        p += 48;
        i -= 48;
      } while (i > 48);
      seed = seed ^ see1 ^ see2;
    }
    while (i > 16) {
      seed = wymix(wyr8(data, p) ^ P1, wyr8(data, p + 8) ^ seed);
      i -= 16;
      p += 16;
    }
    a = wyr8(data, p + i - 16);
    b = wyr8(data, p + i - 8);
  }
  return wymix(P1 ^ BigInt(len), wymix(a ^ P1, b ^ seed));
}

/** Frame variable-length inputs unambiguously: each chunk is prefixed by
 * its u64 little-endian byte count. */
export function lengthPrefixedStream(chunks: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const c of chunks) total += 8 + c.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    let n = c.length;
    for (let i = 0; i < 8; i++) {
      out[o + i] = n & 0xff;
      // Length fits a double exactly for any real source tree; shift via
      // division to stay integer-exact past 2^31.
      n = Math.floor(n / 256);
    }
    o += 8;
    out.set(c, o);
    o += c.length;
  }
  return out;
}

/** A u64 as the schema's hash encoding: exactly 16 lowercase hex digits. */
export function hex16(v: bigint): string {
  return (v & MASK64).toString(16).padStart(16, "0");
}

/** The `build_id` seed of the schema's worked definition. */
export const BUILD_ID_SEED = 0xb11d1d00n;

/** The "module-graph" source-hash contract's seed (profile-selectable
 * contract; scriptc v1 implements exactly this one). */
export const SOURCE_HASH_SEED = 0xc0de5eedn;
