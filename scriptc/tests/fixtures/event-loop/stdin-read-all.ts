// The readStdin() shape (first chunk via once-'data', the rest via
// for-await): output is chunk-boundary-INSENSITIVE (total length +
// decoded text) because Node and the native loop may slice pipe reads
// differently — only the reassembled bytes are contractual.
async function readAll(): Promise<Uint8Array | null> {
  if (process.stdin.isTTY) return null;
  const first = await new Promise<Uint8Array | null>((resolve) => {
    process.stdin.once("data", (chunk) => resolve(chunk));
    process.stdin.once("end", () => resolve(null));
    process.stdin.once("error", () => resolve(null));
  });
  if (first === null) return null;
  const chunks: Uint8Array[] = [first];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const buf = Buffer.concat(chunks);
  return buf.length > 0 ? new Uint8Array(buf) : null;
}

async function main(): Promise<void> {
  const data = await readAll();
  if (data === null) {
    console.log("no data");
  } else {
    console.log("len", data.length);
    console.log(new TextDecoder().decode(data));
  }
}
main();
