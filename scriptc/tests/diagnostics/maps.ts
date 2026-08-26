// Map support boundaries: what stays rejected at LOWERING, with specific
// messages (the checker-level fences — seeded constructors, keys()/values()/
// entries(), spread, set-chaining — live in maps-surface.ts: the ambient
// declaration makes those type errors before lowering).

// Keys must be string or number (SameValueZero hashing is honest for
// exactly those) — the new-site diagnostic names the key type.
const byFlag = new Map<boolean, string>();

// Values exclude functions (no closure story in the uniform value slot yet).
const handlers = new Map<string, () => void>();

// ... and nested Maps (no maps of maps this round).
const nested = new Map<string, Map<string, number>>();

// Map-typed slots elsewhere report the ordinary unsupported-type diagnostic.
function useBad(m: Map<boolean, number>): number {
  return m.size;
}

// Maps as union arms have no narrowing test — rejected like function arms.
function maybeMap(cond: boolean): Map<string, number> | undefined {
  return undefined;
}

// Maps as array elements: ScrArr has no map element kind.
const rows: Map<string, number>[] = [];

// Maps are not JSON (Node stringifies them as the useless "{}" husk;
// scriptc rejects instead of shipping that).
const m = new Map<string, number>();
console.log(JSON.stringify(m));

// Map methods have no bound-value form — call them directly.
const getter = m.get;

// Reached: collection defers its diagnostics until a reference makes
// them relevant; these references are what makes them count.
useBad(new Map<boolean, number>());
maybeMap(true);
