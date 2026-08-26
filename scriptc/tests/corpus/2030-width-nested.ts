// NESTED structural width: a field whose own record type needs narrowing
// reshapes recursively — the copy stance applies per level (SEMANTICS.md 36).
// Everything here is read-after-narrow, where the per-level copy is
// observationally identical to Node's aliasing.
type Inner = { a: string; b: number };
type Outer = { tag: string; inner: Inner };

const o: Outer = { tag: "t", inner: { a: "x", b: 2 } };
const n: { tag: string; inner: { a: string } } = o;
console.log(n.tag, n.inner.a);

// Two levels deep: the inner field's own field narrows again.
type Deep = { top: { mid: { keep: string; drop: number }; label: string } };
const d: Deep = { top: { mid: { keep: "k", drop: 9 }, label: "L" } };
const dn: { top: { mid: { keep: string } } } = d;
console.log(dn.top.mid.keep);

// Nested width through an OPTIONAL target field: the field's record
// reshapes, then wraps into the undefined-armed union.
type Full = { a: string; b: number };
const src: { inner: Full } = { inner: { a: "opt", b: 1 } };
const dst: { inner?: { a: string } } = src;
console.log(dst.inner === undefined ? "none" : dst.inner.a);

// A field holding an ARRAY of wide records: per-element nested reshape.
type Item = { id: string; n: number };
const holder: { items: Item[] } = { items: [{ id: "a", n: 1 }, { id: "b", n: 2 }] };
const slim: { items: { id: string }[] } = holder;
const ids: string[] = [];
for (const it of slim.items) ids.push(it.id);
console.log(ids.join(","));

// A field whose UNION needs a per-arm width lift (the re-tag composes
// with the reshape inside the field).
type Hit = { id: string; score: number };
type SrcRow = { name: string; hit: Hit | undefined };
type DstRow = { name: string; hit: { id: string } | undefined };
const rows: SrcRow[] = [
  { name: "x", hit: { id: "h1", score: 5 } },
  { name: "y", hit: undefined },
];
for (const r of rows) {
  const dr: DstRow = r;
  console.log(dr.name, dr.hit === undefined ? "-" : dr.hit.id);
}

// Nested width through call arguments and returns.
function describe(v: { tag: string; inner: { a: string } }): string {
  return `${v.tag}:${v.inner.a}`;
}
console.log(describe(o));
function firstSlim(xs: { items: { id: string }[] }): string {
  return xs.items.length === 0 ? "-" : xs.items[0]!.id;
}
console.log(firstSlim(holder));
// (JSON.stringify of a NARROWED value is deliberately not pinned here:
// the reshape drops the reduced-away fields where Node, never reshaping,
// keeps them — divergence 36's checker-type consequence, now per level.)
