// `module.exports = Class; module.exports.Strings = Strings` where the
// attached member is a dyn-holding object-literal const (the JS identity
// story): the export global holds the SAME dyn object instead of a
// record-typed slot the dyn value cannot enter (that mismatch was an
// SC9001 ICE: assign expected record, got dyn). Same-file reads through
// module.exports observe the shared node — a write through the const is
// visible through the export, exactly Node.
'use strict';
class Handler {}
const Strings = { a: 'A', b: 'B' };
module.exports = Handler;
module.exports.Strings = Strings;
console.log(module.exports.Strings.a, module.exports.Strings.b);
Strings.a = 'A2';
console.log(module.exports.Strings.a);
