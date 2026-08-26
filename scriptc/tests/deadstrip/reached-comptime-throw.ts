// comptime bakes at lowering: a REACHED comptime callback that throws
// fails the build at compile time (the unreached twin in
// tests/corpus/420-dead-strip-modules never evaluates at all).
function boom(): number {
  return comptime((): number => {
    throw "evaluated after all";
  });
}
console.log(boom());
