// A kill+break arm stages its kill at the post-loop merge, not at the in-body fall-through — later iterations' reads keep the narrow.
function tally(vals: readonly number[], limit: number): number {
  let p: number | null = 10;
  if (p === null) return -1;
  let sum = 0;
  for (const v of vals) {
    if (v > limit) { p = null; break; }
    sum += p;
  }
  if (p === null) return -sum;
  return sum + p;
}
console.log(tally([1, 2, 3], 5));
console.log(tally([1, 9, 3], 5));
