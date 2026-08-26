// A continue-carried kill in a do-while leaves the trailing test on the LIVE optional — the test must re-test.
interface P { readonly v: number; }
function g(q: P | null, r: P | null): number {
  let p: P | null = q;
  let n = 0;
  do {
    if (p === null) return -1;
    n += p.v;
    if (n < 3) {
      p = r;
      continue;
    }
    n += 1;
  } while (p !== null && p.v > 0 && n < 10);
  return n;
}
console.log(g({ v: 2 }, { v: 1 }));
console.log(g({ v: 2 }, null));
console.log(g(null, { v: 1 }));
