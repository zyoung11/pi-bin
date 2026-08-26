// A null guard in a while CONDITION re-tests per iteration; a body reassignment that may produce null feeds the next test.
interface Sel { readonly at: number; readonly len: number; }
function walk(start: Sel | null): number {
  let cur: Sel | null = start;
  let hops = 0;
  while (cur !== null && cur.len > 0) {
    hops += cur.len;
    cur = cur.len > 2 ? { at: cur.at, len: cur.len - 1 } : null;
  }
  return hops;
}
console.log(walk({ at: 0, len: 4 }));
console.log(walk(null));
