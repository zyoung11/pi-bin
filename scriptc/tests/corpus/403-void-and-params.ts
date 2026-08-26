function log3(a: number, b: string, c: boolean): void {
  console.log(a, b, c);
}
function reassignParam(s: string): string {
  s = s + s;
  s = s + "?";
  return s;
}
log3(1, "two", true);
console.log(reassignParam("ha"));

function earlyReturn(n: number): void {
  const label = `n=${n}`;
  if (n < 0) {
    console.log(label, "early");
    return;
  }
  console.log(label, "late");
}
earlyReturn(-1);
earlyReturn(1);
