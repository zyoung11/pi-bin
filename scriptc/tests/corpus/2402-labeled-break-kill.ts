// Unlabeled break stages a kill at the inner loop's exit; a labeled break stages it past the OUTER loop — the outer body read between them differs.
function nested(grid: readonly number[], cols: number): number {
  let p: number | null = 5;
  if (p === null) return -1;
  let sum = 0;
  for (const r of grid) {
    for (const c of grid) {
      if (c > cols) { p = null; break; }
      sum += p;
    }
    if (p === null) break;
    sum += p;
  }
  return sum;
}
function labeled(grid: readonly number[], cols: number): number {
  let p: number | null = 5;
  if (p === null) return -1;
  let sum = 0;
  outer: for (const r of grid) {
    for (const c of grid) {
      if (c > cols) { p = null; break outer; }
      sum += p;
    }
    sum += p;
  }
  if (p === null) return -2;
  return sum + p;
}
console.log(nested([1, 2], 3));
console.log(nested([1, 4], 3));
console.log(labeled([1, 2], 3));
console.log(labeled([1, 4], 3));
