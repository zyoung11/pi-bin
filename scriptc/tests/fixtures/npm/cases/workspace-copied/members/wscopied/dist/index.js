"use strict";
// The same bundled-dist diet as the SYMLINKED twin (wsunclean): shapes
// tsc's checkJs refuses but Node runs happily. Here the install COPIED
// this package into node_modules instead of linking it, so these lines
// sit inside node_modules (never pulled into the checker's program) —
// the gate this tree pins is the IMPORT-SITE one: the package ships no
// declarations, and the implicit-any module error must not gate the
// build for the program author's own workspace member.
function greet(name) {
  return "hi " + name;
}
greet = function (name) {
  return "hello " + name;
};
if (process.env.WSCOPIED_NEVER_SET) ;
exports.describe = function (n) {
  return "wscopied:" + greet("go") + ":" + n * 2;
};
