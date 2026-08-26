// A switch arm reassigning a narrowed local to null kills the narrow past the switch; other arms keep using the narrow in-body.
type Msg = { readonly kind: "set"; readonly value: number } | { readonly kind: "clear" };
function f(q: number | null, msg: Msg): number {
  let p: number | null = q;
  if (p === null) return -1;
  switch (msg.kind) {
    case "set": {
      p = p + msg.value;
      break;
    }
    case "clear": {
      p = null;
      break;
    }
  }
  if (p === null) return 0;
  return p;
}
console.log(f(5, { kind: "set", value: 3 }));
console.log(f(5, { kind: "clear" }));
console.log(f(null, { kind: "clear" }));
