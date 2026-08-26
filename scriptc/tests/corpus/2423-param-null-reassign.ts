// Assigning null to a narrowed union-typed PARAMETER kills the narrow; the ?? after the merge reads the live union.
function clampToLimit(p: number | null, lim: number): number {
  if (p !== null && p > lim) {
    p = null;
  }
  return p ?? lim;
}
console.log(clampToLimit(5, 10));
console.log(clampToLimit(15, 10));
console.log(clampToLimit(null, 10));
