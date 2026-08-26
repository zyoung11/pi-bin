"use strict";
// The bundled-dist diet: shapes tsc's checkJs REFUSES but Node runs
// happily (@vercel/go's ncc bundle carries dozens of each — a function
// binding reassigned, an executor-less-looking resolve(), an empty if
// body). The package ships NO declarations and its realpath lies OUTSIDE
// node_modules (the workspace link), so the checker's program pulls this
// file in and finds the errors — which must never gate: the island is
// this file's one execution home.
function greet(name) {
  return "hi " + name;
}
greet = function (name) {
  return "hello " + name;
};
if (process.env.WSUNCLEAN_NEVER_SET) ;
var ready = new Promise(function (resolve) {
  resolve();
});
exports.describe = function (n) {
  return "wsunclean:" + greet("go") + ":" + n * 2;
};
exports.ready = ready;
