// A kill sealed behind an infinite loop (while(true) {}, for(;;true), do{}while(true)) never reaches the merge — the fall-through read keeps its narrow.
function viaWhile(q: number | null, flag: boolean, bump: number): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
    while (true) {}
  }
  return p + bump;
}
function viaFor(q: number | null, flag: boolean, bump: number): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
    for (let i = 0; true; i += 1) {}
  }
  return p + bump;
}
function viaDoWhile(q: number | null, flag: boolean, bump: number): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
    do {} while (true);
  }
  return p + bump;
}
console.log(viaWhile(5, false, 2));
console.log(viaFor(6, false, 2));
console.log(viaDoWhile(7, false, 2));
console.log(viaWhile(null, false, 2));
