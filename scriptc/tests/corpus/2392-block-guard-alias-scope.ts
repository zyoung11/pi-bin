// A terminal guard inside a bare { } block narrows past the block; narrowing a block-local ALIAS narrows only the alias — the outer binding re-tests after the block.
interface P { readonly v: number; }
function blockGuard(p: P | null): number {
  { if (p === null) return -1; }
  return p.v;
}
function aliasGuard(q: P | null): number {
  {
    const inner = q;
    if (inner === null) return -1;
    if (inner.v === 7) return 7;
  }
  if (q === null) return 0;
  return q.v;
}
console.log(blockGuard({ v: 5 }));
console.log(blockGuard(null));
console.log(aliasGuard(null));
console.log(aliasGuard({ v: 7 }));
console.log(aliasGuard({ v: 5 }));
