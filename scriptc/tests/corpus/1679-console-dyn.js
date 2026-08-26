// console.log over checked-dynamic values: Node's console formatter for a
// non-format argument — strings VERBATIM, everything else through inspect
// at the rest-args depth 2. Scalar kinds byte-exact (-0 included), boxed
// functions as [Function: name] / [Function (anonymous)], composites
// through the dyn walk with the 100-item truncation and the depth-2
// placeholders. console.log never throws.
'use strict';
let d = JSON.parse('{"a":1,"b":[1,2,{"c":"x"}],"s":"str"}');
console.log(d);
console.log('mix', d, 5, 'end');
console.log(d.a, d.s);
console.log(d.b);

let arr = JSON.parse('[1,"two",true,null]');
console.log(arr);
console.log(JSON.parse('-0'));
console.log(JSON.parse('"plain string prints verbatim"'));
console.log(JSON.parse('null'), JSON.parse('true'));

let deep = JSON.parse('{"a":{"b":{"c":{"d":1}}}}');
console.log(deep);

let big = JSON.parse('[' + Array.from({ length: 130 }, (_, i) => i).join(',') + ']');
console.log(big);

let f = (a) => a;
console.log(f);
console.log(function named(a) { return a; });
console.log((a) => a);
let obj = JSON.parse('{}');
let empt = JSON.parse('[]');
console.log(obj, empt);
