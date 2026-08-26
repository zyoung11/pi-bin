// A kill on an always-throwing path is dead on the in-line flow but LIVE inside the catch — the handler must re-test.
interface P { readonly v: number; }
interface BoomError { readonly kind: "boom"; readonly at: number; }
function f(a: P | null, flag: boolean): number {
  let p: P | null = a;
  if (p === null) return -1;
  let n = 0;
  try {
    if (flag) { p = null; throw { kind: "boom", at: 0 } as BoomError; }
    n += p.v;
  } catch (err) {
    if (p === null) {
      n += 1;
    } else {
      n += p.v;
    }
  }
  if (p === null) return n;
  return n + p.v;
}
console.log(f({ v: 4 }, false));
console.log(f({ v: 4 }, true));
console.log(f(null, true));
