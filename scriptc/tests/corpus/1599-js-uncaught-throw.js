// @exit: 1
// An uncaught throw from plain JS: stdout before the throw is compared;
// exit code 1 on both sides (stderr's report format is the documented
// divergence, like every @exit program).
'use strict';

/** @param {number} n */
function risky(n) {
  if (n > 2) throw new Error(`too big: ${n}`);
  return n * 10;
}

console.log(risky(1));
console.log(risky(2));
console.log(risky(3));
console.log("never reached");
