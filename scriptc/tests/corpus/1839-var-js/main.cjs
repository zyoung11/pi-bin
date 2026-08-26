// `var` in a CommonJS file: the require-alias declaration form and
// var-driven loops with function-expression closures.
var lib = require("./lib.cjs");

var total = 0;
for (var i = 0; i < 4; i++) {
  total = lib.inc();
}
console.log(total, i);

function collect() {
  var out = [];
  for (var k = 0; k < 3; k++) {
    out.push(function () { return k; });
  }
  return out.map(function (f) { return f(); }).join(",");
}
console.log(collect());
