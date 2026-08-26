// A kill+continue rides the back edge to the next iteration's test; the same-iteration fall-through keeps its narrow.
function contGood(vals: readonly number[], limit: number): number {
  let p: number | null = 10;
  let sum = 0;
  for (const v of vals) {
    if (p === null) break;
    sum += p;
    if (v > limit) { p = null; continue; }
    sum += p;
  }
  if (p === null) return -sum;
  return sum + p;
}
console.log(contGood([1, 2], 5));
console.log(contGood([9, 2], 5));
console.log(contGood([1, 9, 2], 5));
