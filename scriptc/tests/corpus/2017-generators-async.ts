// Generators and the async machinery compose: bodies drive generators
// between awaits (the generator fiber suspends synchronously inside the
// async fiber), and generator objects live across suspension points.
function* nums(): Generator<number, void, unknown> {
  yield 1;
  yield 2;
  yield 3;
}
function delay(ms: number): Promise<number> {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
}
async function drive(): Promise<number> {
  let sum = 0;
  const g = nums();
  let r = g.next();
  while (!r.done) {
    sum += r.value;
    await delay(1);
    r = g.next();
  }
  for (const x of nums()) sum += x * 10;
  return sum;
}
async function main(): Promise<void> {
  console.log("start");
  const s = await drive();
  console.log("sum", s);
}
void main();
console.log("spawned");
