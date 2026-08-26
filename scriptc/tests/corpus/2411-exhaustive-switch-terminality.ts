// A defaultless switch over a literal union is terminal iff it covers every member — covered seals a kill, uncovered merges it; an exhaustive switch needs no trailing return.
type Mode = "a" | "b" | "c";
function covered(q: number | null, flag: boolean, mode: Mode): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
    switch (mode) {
      case "a":
        return 1;
      case "b":
        return 2;
      case "c":
        return 3;
    }
  }
  return p + 1;
}
function uncovered(q: number | null, flag: boolean, mode: Mode): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
    switch (mode) {
      case "a":
      case "b":
        return 10;
    }
  }
  if (p === null) return 0;
  return p + 1;
}
function ender(mode: Mode): number {
  switch (mode) {
    case "a":
    case "b":
      return 10;
    case "c":
      return 20;
  }
}
console.log(covered(5, true, "a"));
console.log(covered(5, false, "c"));
console.log(uncovered(5, true, "a"));
console.log(uncovered(5, true, "c"));
console.log(uncovered(5, false, "c"));
console.log(ender("b"));
console.log(ender("c"));
