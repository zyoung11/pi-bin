// break and continue guards narrow the rest of the loop iteration exactly like an early return — null guards and discriminant guards both.
interface NumResult { readonly value: number; readonly next: number; }
function parseNumber(body: readonly number[], i: number): NumResult | null {
  if (i >= body.length) return null;
  return { value: body[i], next: i + 1 };
}
function collect(body: readonly number[]): number[] {
  const out: number[] = [];
  let i = 0;
  while (i < body.length) {
    const r = parseNumber(body, i);
    if (r === null) break;
    out.push(r.value);
    i = r.next;
  }
  return out;
}
type Msg = { readonly kind: "num"; readonly value: number } | { readonly kind: "stop" };
function prefixTotal(msgs: readonly Msg[]): number {
  let sum = 0;
  for (const msg of msgs) {
    if (msg.kind !== "num") break;
    sum += msg.value;
  }
  return sum;
}
function numTotal(msgs: readonly Msg[]): number {
  let sum = 0;
  for (const msg of msgs) {
    if (msg.kind !== "num") continue;
    sum += msg.value;
  }
  return sum;
}
console.log(collect([5, 6, 7]).join(","));
const msgs: Msg[] = [{ kind: "num", value: 2 }, { kind: "stop" }, { kind: "num", value: 5 }];
console.log(prefixTotal(msgs));
console.log(numTotal(msgs));
