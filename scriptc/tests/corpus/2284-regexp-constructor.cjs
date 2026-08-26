// new RegExp(pattern, flags): runtime construction over the literal
// engine — eager compile throws Node's catchable SyntaxError on bad
// patterns and unknown flags; template-built patterns (test/common's
// PEM matcher shape) work like literals.
'use strict';
const assert = require('assert');
const label = 'RSA PUBLIC KEY';
const head = `\\-\\-\\-\\-\\-BEGIN ${label}\\-\\-\\-\\-\\-`;
const re = new RegExp(`^${head}$`);
console.log(re.test('-----BEGIN RSA PUBLIC KEY-----'));
console.log(re.test('nope'));
console.log(new RegExp('a+b', 'i').test('AAB'));
assert.throws(() => new RegExp('('), SyntaxError);
assert.throws(() => new RegExp('a', 'x'), SyntaxError);
console.log(new RegExp('').test('anything'));
console.log(String(new RegExp('a+', 'g').source));
console.log('ok');
