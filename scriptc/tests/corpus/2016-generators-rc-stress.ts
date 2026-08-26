// RC stress: strings and records flowing through yield channels in
// volume, generators created and fully drained in loops, and .return()
// mid-drain releasing the parked values.
function* strs(n: number): Generator<string, void, unknown> {
  for (let i = 0; i < n; i++) yield "s" + i;
}
let acc = "";
for (const s of strs(50)) acc += s.length;
console.log(acc.length);
function* strsRet(n: number): Generator<string, number, unknown> {
  for (let i = 0; i < n; i++) yield "s" + i;
  return n;
}
for (let round = 0; round < 20; round++) {
  const g = strsRet(5);
  g.next();
  g.next();
  const r = g.return(round);
  console.log(round, r.done === true, r.value as number);
}
type Rec = { name: string; hits: number };
function* recs(): Generator<Rec, void, unknown> {
  for (let i = 0; i < 10; i++) yield { name: "n" + i, hits: i * 2 };
}
let total = 0;
for (const r of recs()) total += r.hits;
console.log(total);
// a generator returning a string: the completion value moves out once
function* label(): Generator<number, string, unknown> {
  yield 1;
  return "done-label";
}
const lg = label();
lg.next();
const lr = lg.next();
console.log(lr.done === true, lr.value as string);
console.log(lg.next().value === undefined);
