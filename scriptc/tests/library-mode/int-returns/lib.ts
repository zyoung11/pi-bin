/* Ask 4's outbound declared-integer returns: each export's return slot is
 * profile-declared i64 (u64 for the unsigned one), so every value below
 * must PROVE whole-in-range at compile time — and the wrapper's
 * fp-to-int conversion then carries the mathematically exact integer the
 * f64 held (the probe reads real int64_t/uint64_t and pins the corpus's
 * singleton crossing values against the Node oracle). */

// The largest safe integer crosses exactly (corpus case 1 at the real edge).
export function retMax(): number {
  return 2 ** 53 - 1;
}

// -0 is whole: the sign of zero is f64-interior; the mathematically
// exact integer 0 crosses (corpus case 4 at the real edge).
export function retNegZero(): number {
  return -0;
}

// JS remainder: the sign follows the dividend — -7 % 3 is exactly -1,
// not 2 (corpus case 9 at the real edge).
export function retRem(): number {
  return -7 % 3;
}

// ToUint32 by the program's own >>> 0: whole, non-negative, uint32 —
// satisfies a u64 slot (corpus case 11 at the real edge).
export function retU32Max(): number {
  return 4294967295 >>> 0;
}
