// Array destructuring over checked-dynamic sources (dyn.iterPack): decl,
// assignment, and callback-param forms; holes, past-the-end undefined,
// defaults firing exactly on undefined (null passes through), nested
// patterns, string sources by code point — and V8's destructuring
// TypeError wordings: the identifier spelling for named sources, the
// kind wording ("number 5 is not iterable (cannot read property
// Symbol(Symbol.iterator))") for parameters and expressions.
'use strict';
const rows = JSON.parse('[["m1","c1"],["m2","c2"]]');
rows.forEach(([msg, code]) => console.log('fe', msg, code));
const first = rows[0];
const [m, c] = first;
console.log('decl', m, c);
const [, tail] = rows[1];
console.log('hole', tail);
const [a, b] = JSON.parse('["only"]');
console.log('past', a, b);
const [d = 'dflt'] = JSON.parse('[]');
console.log('default', d);
const [n = 'dflt'] = JSON.parse('[null]');
console.log('null-through', n);
const [[x, y]] = JSON.parse('[[1,2]]');
console.log('nested', x, y);
const [c1, c2] = JSON.parse('"hé"');
console.log('str', c1, c2);
let p, q;
[p, q] = rows[1];
console.log('assign', p, q);
const bad = JSON.parse('5');
try {
  const [z] = bad;
} catch (err) {
  console.log('caught:', err.message);
}
try {
  const [z] = JSON.parse('{"a":1}');
} catch (err) {
  console.log('caught:', err.message);
}
const g = ([z]) => z;
try {
  g(JSON.parse('null'));
} catch (err) {
  console.log('caught:', err.message);
}
try {
  g(JSON.parse('true'));
} catch (err) {
  console.log('caught:', err.message);
}
console.log('done');
