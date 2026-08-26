// Surplus arguments to a fixed-arity function (JS-only shape — tsc's arity
// families don't gate .js builds, SEMANTICS.md 116): JS evaluates them and
// DROPS them, and effect-free surplus (literals, plain reads, closures)
// drops at compile time. The recursive shape is test-string-decoder.js's
// writeSequences — a 3-param function calling itself with 4 args — which
// used to ICE the validator (call: 4 args, expected 3).
'use strict';

function writeSequences(length, start, sequence) {
  if (start === undefined) {
    start = 0;
    sequence = [];
  } else if (start === length) {
    return [sequence];
  }
  let sequences = [];
  for (let end = length; end > start; end--) {
    const subSequence = sequence.concat([[start, end]]);
    const subSequences = writeSequences(length, end, subSequence, sequences);
    sequences = sequences.concat(subSequences);
  }
  return sequences;
}

// 2^(n-1) sequences for a length-n buffer — the counts prove the
// recursion ran with its surplus fourth argument dropped.
console.log(writeSequences(3).length);
console.log(writeSequences(4).length);
console.log(writeSequences(5).length);

// Surplus literals, a surplus variable read, and a surplus function
// expression against a 2-param function: all drop, the call answers from
// its declared params only.
function add(a, b) {
  return a + b;
}
const unused = 'never read by add';
console.log(add(1, 2, 99));
console.log(add(3, 4, unused));
console.log(add(5, 6, function ignored() { return 'x'; }, null, undefined, true));
