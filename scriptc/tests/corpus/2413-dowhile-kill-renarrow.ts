// A do-while body kill re-narrowed by a later body guard reaches the trailing test narrowed again.
interface P { readonly v: number; }
function g(q: P | null, r: P | null): number {
  let p: P | null = q;
  if (p === null) return -1;
  let n = 0;
  do {
    n += p.v;
    p = r;
    if (p === null) return -1;
  } while (p.v > 0 && n < 10);
  return n;
}
console.log(g({ v: 4 }, { v: 0 }));
console.log(g({ v: 4 }, { v: 2 }));
console.log(g({ v: 4 }, null));
console.log(g(null, { v: 1 }));
