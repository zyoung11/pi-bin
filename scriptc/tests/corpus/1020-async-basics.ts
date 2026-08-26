function delay(ms: number): Promise<number> {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
}
async function work(tag: string): Promise<string> {
  console.log("start", tag);
  const got = await delay(10);
  console.log("mid", tag, got);
  await delay(5);
  return `done-${tag}`;
}
async function main2(): Promise<void> {
  const a = work("A");
  const b = work("B");
  console.log("spawned both");
  console.log(await a, await b);
}
main2();
console.log("top-level after spawn");
