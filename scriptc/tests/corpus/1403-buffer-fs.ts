// The Buffer forms of fs: readFileSync(path) with no encoding → Buffer,
// writeFileSync(path, buffer) byte-exact (a NUL and non-utf8 sequences
// survive), and THE chain real code uses: new Uint8Array(await readFile(p)).
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

function tail(path: string): string {
  let i = path.length - 1;
  while (i >= 0 && path.charAt(i) !== "/" && path.charAt(i) !== "\\") {
    i = i - 1;
  }
  return path.slice(i + 1);
}
// The pid keeps the scratch name unique: the C and LLVM differential
// harnesses run this program CONCURRENTLY, and both cache binaries are
// named "program", so an argv-derived name alone collides across them
// (the 1640 precedent).
const path = "tmp-1403-" + tail(process.argv[1]) + "-" + process.pid + ".bin";

const blob = Buffer.from("00ff80eda0bd0a", "hex");
writeFileSync(path, blob);
const back = readFileSync(path);
console.log("rt", back.length, back.toString("hex"));
console.log("elem", back[0], back[1]);

// Uint8Array data writes too (u8 is u8).
writeFileSync(path, new Uint8Array([1, 0, 2]));
console.log("u8", readFileSync(path).toString("hex"));

async function viaPromises(): Promise<void> {
  const buf = await readFile(path);
  console.log("fsp", buf.toString("hex"));
  const arr = new Uint8Array(await readFile(path));
  console.log("chain", arr.length, arr[0], arr[1], arr[2]);
}
async function main(): Promise<void> {
  await viaPromises();
  try {
    readFileSync("no-such-file-1403.bin");
    console.log("no-throw");
  } catch (e) {
    if (e instanceof Error) {
      console.log("err", e.message);
    }
  }
  rmSync(path);
  console.log("done");
}
main();
