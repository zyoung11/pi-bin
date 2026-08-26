// A branch reassigning a narrowed local to null kills the narrow past the merge — then-arm and else-arm kills both.
function thenKill(q: number | null, flag: boolean): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
  }
  if (p === null) return 0;
  return p;
}
function elseKill(q: number | null, flag: boolean): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    // this path keeps the narrowing; the merge must still drop it
  } else {
    p = null;
  }
  if (p === null) return 0;
  return p;
}
console.log(thenKill(5, true));
console.log(thenKill(5, false));
console.log(thenKill(null, true));
console.log(elseKill(5, true));
console.log(elseKill(5, false));
