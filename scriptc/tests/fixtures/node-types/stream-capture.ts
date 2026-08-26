/* process.stdout/stderr as NodeJS.WritableStream VALUES captured by
 * closures — the prefixStream idiom: the procStream scalar (the stream's
 * fd) rides capture boxes like any number. The test pins stdout. */
function prefixed(output: NodeJS.WritableStream, prefix: string): () => void {
  return () => {
    output.write(`${prefix} line\n`);
  };
}
const toOut = prefixed(process.stdout, "[out]");
toOut();
toOut();
const toErr = prefixed(process.stderr, "[err]");
toErr();
console.log("done");
