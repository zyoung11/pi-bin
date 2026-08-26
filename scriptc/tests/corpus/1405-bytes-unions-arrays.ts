// Bytes values riding the composite machinery: union arms (Uint8Array |
// null, Buffer | string with Buffer.isBuffer narrowing), Uint8Array[]
// arrays feeding Buffer.concat, promise<Uint8Array> results, and the raw
// process.stdout.write(buffer) byte write.
function hex(x: Uint8Array): string {
  return Buffer.from(x).toString("hex");
}

function maybeBytes(n: number): Uint8Array | null {
  return n > 0 ? new Uint8Array([1, 2]) : null;
}
const some = maybeBytes(1);
if (some !== null) {
  console.log("some", some.length, hex(some));
}
const none = maybeBytes(0);
console.log("none", none === null);

function pick(n: number): Buffer | string {
  return n > 0 ? Buffer.from("ab") : "cd";
}
const x = pick(1);
if (Buffer.isBuffer(x)) {
  console.log("buf", x.toString("hex"));
} else {
  console.log("str", x);
}
const y = pick(0);
if (Buffer.isBuffer(y)) {
  console.log("buf", y.toString("hex"));
} else {
  console.log("str", y);
}

const chunks: Uint8Array[] = [];
chunks.push(new Uint8Array([1]));
chunks.push(new Uint8Array([2, 3]));
chunks.push(Buffer.from("ff", "hex"));
console.log("chunks", chunks.length, chunks[1].length);
const cat = Buffer.concat(chunks);
console.log("cat", hex(cat));

async function makeBytes(): Promise<Uint8Array> {
  return new Uint8Array([7, 8, 9]);
}
async function main(): Promise<void> {
  const got = await makeBytes();
  console.log("await", hex(got));
  process.stdout.write(Buffer.from("raw-bytes\n", "utf8"));
  process.stdout.write(Buffer.from("e29c930a", "hex"));
  console.log("done");
}
main();
