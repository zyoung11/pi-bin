// K1/K2/K8 fixture: scalar marshalling round-trips (f64 including -0, NaN,
// MAX_SAFE_INTEGER; bool both directions; the u8/u32/i32 plumbing classes)
// plus the archive-level symbol and ambient audits the harness runs over
// this fixture's artifacts.
export function add(a: number, b: number): number {
  return a + b;
}

export function passthrough(x: number): number {
  return x;
}

export function negZero(): number {
  return -0;
}

export function isNan(x: number): boolean {
  return Number.isNaN(x);
}

export function invert(f: boolean): boolean {
  return !f;
}

// Host-produced inbound plumbing (tags, indices, deltas) carries no
// TS-side proof obligation: the classes convert to f64 on entry.
export function plumb(tag: number, idx: number, delta: number): number {
  return tag * 1000 + idx * 10 + delta;
}

console.log("scalars ready");
