// K3 fixture: string/bytes round-trips and result lifetime under both
// arena postures (the harness builds this library twice — once with the
// auto-reset profile as written, once with a declared reset symbol patched
// in). The regex-using export additionally proves the gated matcher unit
// rides the library archive.
export function shout(s: string): string {
  return s.toUpperCase() + "!";
}

export function strlen(s: string): number {
  return s.length;
}

export function wrap(b: Uint8Array): Uint8Array {
  const out = new Uint8Array(b.length + 2);
  out[0] = 60; // '<'
  for (let i = 0; i < b.length; i = i + 1) {
    out[i + 1] = b[i]!;
  }
  out[out.length - 1] = 62; // '>'
  return out;
}

export function dashes(s: string): string {
  return s.replace(/x+/g, "-");
}

console.log("buffers ready");
