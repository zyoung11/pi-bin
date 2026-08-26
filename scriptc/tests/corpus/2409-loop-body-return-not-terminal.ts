// A loop body whose terminal statement returns is NOT a returning branch — zero iterations fall through, and a kill+break/continue before the return still merges.
function viaBreak(q: number | null, xs: readonly number[]): number {
  let p: number | null = q;
  if (p === null) return -1;
  for (const x of xs) {
    if (x < 0) { p = null; break; }
    return -2;
  }
  if (p === null) return 0;
  return p;
}
function viaContinue(q: number | null, xs: readonly number[]): number {
  let p: number | null = q;
  if (p === null) return -1;
  for (const x of xs) {
    if (x < 0) { p = null; continue; }
    return -2;
  }
  if (p === null) return 0;
  return p;
}
console.log(viaBreak(5, [-1]));
console.log(viaBreak(5, [1]));
console.log(viaBreak(5, []));
console.log(viaContinue(5, [-1]));
console.log(viaContinue(5, [-1, 1]));
console.log(viaContinue(5, []));
