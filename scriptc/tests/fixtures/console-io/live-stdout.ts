console.log("log-ready");
process.stdout.write("string-ready|");
process.stdout.write(
  new Uint8Array([98, 121, 116, 101, 115, 45, 114, 101, 97, 100, 121]),
);

// Keep the child alive so the parent can prove the bytes arrived before exit.
setTimeout(() => {}, 30_000);
