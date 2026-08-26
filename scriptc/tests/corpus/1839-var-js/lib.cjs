// Module-scope var state in a required CJS module.
var count = 0;
function inc() {
  count += 1;
  return count;
}
exports.inc = inc;
