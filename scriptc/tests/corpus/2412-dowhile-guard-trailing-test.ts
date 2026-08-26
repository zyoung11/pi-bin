// A terminal guard in a do-while BODY narrows the trailing while-test — the test reads the payload without a re-test.
interface P { readonly v: number; }
function bodyAndTest(q: P | null): number {
  let n = 0;
  const p: P | null = q;
  do {
    if (p === null) return -1;
    n += p.v;
    n += 1;
  } while (p.v > 0 && n < 10);
  return n;
}
function testOnly(q: P | null): number {
  let n = 0;
  const p: P | null = q;
  do {
    if (p === null) return -1;
    n += 1;
  } while (p.v > n);
  return n;
}
console.log(bodyAndTest({ v: 2 }));
console.log(bodyAndTest({ v: 0 }));
console.log(bodyAndTest(null));
console.log(testOnly({ v: 3 }));
console.log(testOnly(null));
