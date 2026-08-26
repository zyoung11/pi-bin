// ReadonlySet/ReadonlyMap are the SAME runtime values as Set/Map — the
// readonly-ness is a checker-only view, so the types map to the identical
// IR kinds and the read surface (.has/.get/.size, for-of) works unchanged
// (the portless reserved-ports idiom: a Set built once, consulted through
// a ReadonlySet-typed parameter).
const reserved: ReadonlySet<number> = new Set([80, 443, 5353]);
console.log(reserved.has(443), reserved.has(3000), reserved.size);

function isReserved(ports: ReadonlySet<number>, p: number): boolean {
  return ports.has(p);
}
console.log(isReserved(reserved, 80), isReserved(reserved, 8080));

const names: ReadonlyMap<string, number> = new Map([
  ["http", 80],
  ["https", 443],
]);
console.log(names.get("https") === 443, names.has("http"), names.has("ftp"), names.size);

function portOf(m: ReadonlyMap<string, number>, k: string): number {
  const v = m.get(k);
  return v === undefined ? -1 : v;
}
console.log(portOf(names, "http"), portOf(names, "gopher"));

// Iteration answers insertion order, exactly like the mutable views.
const seen: number[] = [];
for (const p of reserved) seen.push(p);
console.log(seen.join(","));
for (const [k, v] of names) console.log(k, v);
