// Float results flow through loop BOUNDS (i < limit * 0.5), mixed int/float ternary arms, and union payloads vs float literals — no integer truncation anywhere.
function steps(limit: number): number {
  let total = 0;
  for (let i = 0; i < limit * 0.5; i++) {
    total += 1;
  }
  return total;
}
type Msg = { readonly kind: "set"; readonly value: number } | { readonly kind: "half" };
function level(msg: Msg): number {
  return msg.kind === "set" ? msg.value : 0.5;
}
function pick(flag: boolean): number {
  const n = flag ? 1 : 2.5;
  return n * 2;
}
console.log(steps(7));
console.log(steps(1));
console.log(level({ kind: "half" }));
console.log(level({ kind: "set", value: 3 }));
console.log(pick(true));
console.log(pick(false));
