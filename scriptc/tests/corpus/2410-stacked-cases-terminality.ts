// Stacked case labels share the next body for terminality; trailing EMPTY clauses fall out of the switch and un-seal a kill.
type Msg =
  | { readonly kind: "inc" }
  | { readonly kind: "dec" }
  | { readonly kind: "reset" };
function stacked(q: number | null, flag: boolean, msg: Msg): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
    switch (msg.kind) {
      case "inc":
      case "dec":
        return 10;
      case "reset":
        return 20;
    }
  }
  return p + 1;
}
function trailingEmpty(q: number | null, flag: boolean, msg: Msg): number {
  let p: number | null = q;
  if (p === null) return -1;
  if (flag) {
    p = null;
    switch (msg.kind) {
      case "inc":
        return 10;
      case "dec":
      case "reset":
    }
  }
  if (p === null) return 0;
  return p + 1;
}
console.log(stacked(5, false, { kind: "inc" }));
console.log(stacked(5, true, { kind: "dec" }));
console.log(stacked(5, true, { kind: "reset" }));
console.log(trailingEmpty(5, true, { kind: "inc" }));
console.log(trailingEmpty(5, true, { kind: "dec" }));
console.log(trailingEmpty(5, false, { kind: "dec" }));
