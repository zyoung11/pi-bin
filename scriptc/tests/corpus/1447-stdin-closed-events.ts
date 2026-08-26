// stdin events against the CLOSED empty stream the harness provides
// (both children get an immediately-ended stdin pipe): 'end' fires, the
// once-'data' listener never does, and a for-await over process.stdin
// yields zero chunks. This is the readStdin() shape run against empty
// input — the piped-data half lives in the event-loop harness, which
// controls what flows in.
async function readAll(): Promise<string> {
  const first = await new Promise<string>((resolve) => {
    process.stdin.once("data", (chunk) => resolve(`data:${chunk.length}`));
    process.stdin.once("end", () => resolve("end"));
    process.stdin.once("error", () => resolve("error"));
  });
  if (first !== "data:0" && first.startsWith("data:")) return first;
  let chunks = 0;
  for await (const chunk of process.stdin) {
    chunks += chunk.length;
  }
  return `${first}, then ${chunks} bytes`;
}

async function main(): Promise<void> {
  console.log(!!process.stdin.isTTY);
  console.log(await readAll());
}
main();
