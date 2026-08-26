// process.stdout.write: the raw byte write — no newline, no formatting —
// interleaved with console.log on the same stream, so source order holds.
process.stdout.write("no newline");
console.log(" <- then a log line");
process.stdout.write("a");
process.stdout.write("b");
process.stdout.write("c\n");
console.log("after abc");

// pieces of one line built across writes and a log
process.stdout.write("progress: ");
process.stdout.write("50%");
process.stdout.write(" ... ");
process.stdout.write("100%\n");

// unicode and escapes pass through byte-exactly
process.stdout.write("café ☕ — tabs\tand\nnewlines\n");
process.stdout.write("");
console.log("empty write ok");

// the return value is Node's backpressure boolean: true for these writes
const ok = process.stdout.write("ret ");
console.log(ok);

// template-built data
const n = 42;
process.stdout.write(`computed ${n}\n`);

// stderr.write exists too (its bytes are not part of this comparison, but
// its return value and non-interference with stdout are)
const eok = process.stderr.write("stderr line\n");
console.log("stderr returned", eok);
console.log("done");
