// setTimeout(resolve, ms) — the sleep idiom: Promise<unknown>'s resolve
// is (value: unknown) => void, and setTimeout invokes its callback with
// NO arguments, so the adapter delivers resolve(undefined) — the promise
// fulfills with undefined, exactly Node.
async function main(): Promise<void> {
  const before = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 20));
  console.log("slept:", Date.now() - before >= 15);

  // The polling-loop shape (waitForProxy): the sleep composes with a for
  // loop and an async predicate.
  let attempts = 0;
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    attempts++;
  }
  console.log("attempts:", attempts);

  // A zero-param callback stays the plain path.
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 5));
  console.log("done");
}
void main();
