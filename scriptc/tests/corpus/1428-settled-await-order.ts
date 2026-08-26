// `await` ALWAYS yields, even on an already-settled promise — the
// continuation runs as a microtask, so the spawner's synchronous code
// finishes first, exactly Node's ordering (the settled-await hop).
async function f(): Promise<void> {
  const p = new Promise<number>((resolve) => resolve(1));
  console.log("before await");
  const v = await p;
  console.log("after await", v);
  const q = new Promise<string>((resolve) => resolve("two"));
  console.log(await q);
}
f();
console.log("top-level after call");
setTimeout(() => console.log("timer"), 0);
