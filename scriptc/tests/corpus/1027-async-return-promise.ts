// `return p` in an async function flattens: the returned promise's
// settlement becomes the async function's result, exactly as if the body
// had written `return await p` — including rejections, which surface at
// the CALLER's await, not inside the returning function.
function make(n: number): Promise<number> {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(n * 2);
    }, 5);
  });
}
async function boom(msg: string): Promise<number> {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 5);
  });
  throw `boom: ${msg}`;
}
function fail(msg: string): Promise<number> {
  // Non-async factory handing back an already-wired rejection.
  return boom(msg);
}
async function fetchDouble(n: number): Promise<number> {
  console.log("fetching", n);
  return make(n);
}
async function fetchBroken(): Promise<number> {
  console.log("fetching broken");
  return fail("wired-through");
}
async function main(): Promise<void> {
  const got = await fetchDouble(21);
  console.log("flattened", got);
  try {
    const never = await fetchBroken();
    console.log("never", never);
  } catch {
    console.log("rejection reached the caller's catch");
  }
  console.log("done");
}
main();
console.log("spawned");
