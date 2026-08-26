// @exit: 1
async function boom(msg: string): Promise<number> {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 5);
  });
  throw `boom: ${msg}`;
}
async function guarded(): Promise<void> {
  try {
    const n = await boom("caught-path");
    console.log("never", n);
  } catch {
    console.log("caught rejection");
  } finally {
    console.log("finally ran");
  }
}
async function run(): Promise<void> {
  await guarded();
  console.log("guarded done");
  await boom("unhandled-path"); // rethrows into run(); nobody awaits run()
  console.log("never reached");
}
run();
console.log("spawned");
