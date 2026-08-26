// A chained selector ternary building a union-typed local: each arm constructs a different union arm; the switch after it dispatches on the discriminant.
type Ev =
  | { readonly kind: "insert"; readonly text: string }
  | { readonly kind: "move"; readonly dx: number; readonly dy: number }
  | { readonly kind: "clear" };
function weigh(sel: number, payload: string, dx: number, dy: number): number {
  const ev: Ev = sel === 0 ? { kind: "insert", text: payload } : sel === 1 ? { kind: "move", dx: dx, dy: dy } : { kind: "clear" };
  switch (ev.kind) {
    case "insert": return ev.text.length;
    case "move": return ev.dx + ev.dy;
    case "clear": return 0;
  }
}
console.log(weigh(0, "hello", 3, 4));
console.log(weigh(1, "hello", 3, 4));
console.log(weigh(2, "hello", 3, 4));
