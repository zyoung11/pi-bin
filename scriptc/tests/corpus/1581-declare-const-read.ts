// `declare const __VERSION__: string` — the bundler-define pattern: the
// ambient global exists only as a type. Running the SOURCE (Node and
// scriptc alike) has no define step, so a read throws the catchable
// ReferenceError "<name> is not defined" at the access — name, message,
// and instanceof pinned.
declare const __VERSION__: string;
declare const __BUILD_FLAG__: boolean;

console.log("before");
try {
  console.log(`v${__VERSION__}`);
} catch (err) {
  if (err instanceof Error) {
    console.log(err.name, "|", err.message);
  }
}
try {
  if (__BUILD_FLAG__) console.log("flagged");
} catch (err) {
  console.log(err instanceof Error ? err.message : "?");
}
console.log("after");
