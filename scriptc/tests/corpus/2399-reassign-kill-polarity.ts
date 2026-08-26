// Reassignment polarity: a possibly-null RHS kills the narrow, a provably non-null RHS keeps it.
interface P { readonly v: number; }
function possiblyNull(q: P | null, r: P | null): number {
  let p: P | null = q;
  if (p !== null) {
    p = r;
    if (p !== null) {
      return p.v;
    }
  }
  return 0;
}
function provablyNonNull(q: P | null, flag: boolean): number {
  let p: P | null = q;
  if (p !== null) {
    if (flag) {
      p = { v: p.v + 10 };
    }
    return p.v;
  }
  return -1;
}
console.log(possiblyNull({ v: 1 }, { v: 2 }));
console.log(possiblyNull({ v: 1 }, null));
console.log(possiblyNull(null, { v: 2 }));
console.log(provablyNonNull({ v: 5 }, true));
console.log(provablyNonNull({ v: 5 }, false));
console.log(provablyNonNull(null, true));
