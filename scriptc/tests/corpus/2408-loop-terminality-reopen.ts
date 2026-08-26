// What re-opens an infinite loop: a bound break or a non-literal condition makes the arm fall through (kill merges); a nested return does not.
function boundBreak(q: number | null, flag: boolean): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
    while (true) {
      if (flag) { break; }
    }
  }
  if (p === null) return 0;
  return p;
}
function nestedReturn(q: number | null, flag: boolean, n: number): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
    while (true) {
      if (n > 0) { return n; }
    }
  }
  return p + 2;
}
function nonLiteral(q: number | null, flag: boolean, n: number): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
    let i = n;
    while (i > 0) { i = i - 1; }
  }
  if (p === null) return 0;
  return p;
}
console.log(boundBreak(5, true));
console.log(boundBreak(5, false));
console.log(nestedReturn(5, true, 3));
console.log(nestedReturn(5, false, 3));
console.log(nonLiteral(5, true, 2));
console.log(nonLiteral(5, false, 2));
