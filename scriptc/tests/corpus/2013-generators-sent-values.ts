// Sent values: the unknown next-channel reads checked-dynamic (each
// .next(v) boxes; a valueless resume delivers undefined), and a TYPED
// next channel requires .next(value) — the yield expression reads it
// directly.
function* acc(): Generator<number, number, unknown> {
  let total = 0;
  while (true) {
    const v = yield total;
    if (v === undefined) return total;
    total += v as number;
  }
}
const a = acc();
console.log(a.next().value as number);
console.log(a.next(5).value as number);
console.log(a.next(7).value as number);
const fin = a.next();
console.log(fin.done === true, fin.value as number);

function* echo(): Generator<number, void, string> {
  const s1 = yield 1;
  console.log("got", s1);
  const s2 = yield 2;
  console.log("got", s2);
}
const e = echo();
console.log(e.next("discarded").value as number);
console.log(e.next("hello").value as number);
console.log(e.next("world").done === true);

// interleaved yields as operands: evaluation order is left-to-right
function* sum(): Generator<number, number, unknown> {
  const t = ((yield 1) as number) + ((yield 2) as number);
  return t;
}
const s = sum();
console.log(s.next().value as number);
console.log(s.next(10).value as number);
const sf = s.next(20);
console.log(sf.done === true, sf.value as number);
