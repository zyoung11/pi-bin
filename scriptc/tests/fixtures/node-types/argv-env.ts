/* The supported process surface, TYPED BY @types/node (the fallback
 * declarations stand down in this fixture): argv and env reads lower to
 * the same static libCalls as always. The test runs the binary with
 * arguments and an env var and pins the output. */
/* argv[0]/argv[1] are the Node-shaped exec/script paths (machine-
 * dependent); the program prints only the user arguments. */
const args = process.argv;
console.log(args.length - 2);
for (let i = 2; i < args.length; i = i + 1) {
  console.log(args[i]);
}
const greeting = process.env.SCRIPTC_FIXTURE_GREETING;
if (greeting !== undefined) {
  console.log(greeting);
} else {
  console.log("no greeting");
}
/* The raw byte writes lower under @types/node's WriteStream types too. */
process.stdout.write("written without newline");
console.log(" <- flushed in order");
