// A kill in one switch clause leaves a LATER clause's entry narrow intact — clauses are siblings, not a sequence.
type Msg =
  | { readonly kind: "kill" }
  | { readonly kind: "use" }
  | { readonly kind: "skip" };
interface P { readonly v: number; }
function f(a: P | null, msg: Msg): number {
  let p: P | null = a;
  if (p === null) return -1;
  switch (msg.kind) {
    case "kill":
      p = null;
      break;
    case "use":
      return p.v;
    case "skip":
      break;
  }
  if (p === null) return 0;
  return p.v;
}
console.log(f({ v: 6 }, { kind: "kill" }));
console.log(f({ v: 6 }, { kind: "use" }));
console.log(f({ v: 6 }, { kind: "skip" }));
