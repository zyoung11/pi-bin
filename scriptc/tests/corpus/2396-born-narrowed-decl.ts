// A declaration initialized from a narrowed value is born narrowed: let p: P | null = q after a q-guard reads p without a re-test.
interface P { readonly v: number; }
function f(q: P | null): number {
  if (q === null) return -1;
  let p: P | null = q;
  return p.v + 1;
}
console.log(f({ v: 9 }));
console.log(f(null));
