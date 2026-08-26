// console.error and console.warn: stderr twins of console.log — identical
// formatting (space-joined args, -0, booleans, unicode), compared
// byte-for-byte against Node's stderr by the harness.
console.error("plain error line");
console.warn("plain warn line");
console.error("mixed", 1, true, "args", false, 2.5);
console.warn(-0, 0, 1e21, 0.1 + 0.2);
console.error();
console.warn();
console.error("unicode: café \u{1f9e8} — ok");
const name = "world";
console.error(`template ${name} ${2 * 21}`);

// Interleaving with stdout: separate streams, each must keep its own
// internal order (the harness compares the two streams independently).
console.log("stdout 1");
console.error("stderr 1");
console.log("stdout 2");
console.warn("stderr 2");
console.log("stdout 3");

// Interleaving with the raw stream writes.
process.stdout.write("raw-out|");
process.stderr.write("raw-err|");
console.error("after raw");
console.log("");

// From inside functions, loops, and async code.
function report(n: number): void {
  if (n % 2 === 0) console.error("even", n);
  else console.warn("odd", n);
}
for (let i = 0; i < 4; i++) report(i);

async function main(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 5);
  });
  console.error("async stderr");
  console.log("async stdout");
}
main();
