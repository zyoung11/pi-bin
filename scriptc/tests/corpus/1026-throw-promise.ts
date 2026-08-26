// Throwing a promise VALUE (JS allows throwing anything). Regression test:
// promise payloads crashed the emitter's exception-cell adapter lookup.
async function make(): Promise<number> {
  return 41;
}

const p = make();
try {
  throw p;
} catch {
  console.log("caught a thrown promise");
}

// The promise itself is unharmed by the throw/catch round trip.
async function run(): Promise<void> {
  console.log(await p);
}
run();
