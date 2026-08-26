// A branch that kills AND returns routes its kill along the return edge — the surviving fall-through keeps its narrow.
interface P { readonly v: number; }
function orelseForm(q: number | null, flag: boolean): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) { p = null; return -2; }
  return p;
}
function captureForm(p0: P | null): number {
  let p: P | null = p0;
  if (p !== null) {
    if (p.v < 0) { p = null; return -1; }
    return p.v;
  }
  return 0;
}
console.log(orelseForm(9, false));
console.log(orelseForm(9, true));
console.log(captureForm({ v: 3 }));
console.log(captureForm({ v: -3 }));
console.log(captureForm(null));
