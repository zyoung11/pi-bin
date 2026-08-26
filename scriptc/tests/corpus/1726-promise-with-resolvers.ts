// Promise.withResolvers: the { promise, resolve, reject } record —
// destructured or held whole — over string, number, and void promises;
// resolution across a timer, rejection caught at the await.
const { promise, resolve, reject } = Promise.withResolvers<string>();
void reject;
setTimeout(() => resolve("hi"), 1);
const done = Promise.withResolvers<void>();
const nums = Promise.withResolvers<number>();
async function main(): Promise<void> {
  console.log("got", await promise);
  setTimeout(() => { nums.resolve(42); done.resolve(); }, 1);
  console.log("num", await nums.promise);
  await done.promise;
  console.log("done signal ok");
  const failing = Promise.withResolvers<string>();
  failing.reject(new RangeError("nope"));
  try {
    await failing.promise;
  } catch (e) {
    if (e instanceof Error) console.log("caught:", e.name, e.message);
  }
  console.log("end");
}
void main();
