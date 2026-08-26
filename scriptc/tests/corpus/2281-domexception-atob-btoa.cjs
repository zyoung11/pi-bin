// DOMException + atob/btoa: the web-standard error shape (a fifth
// runtime error class — name/code table, options-form cause, Error
// toString) and the WHATWG forgiving-base64 globals (WebIDL ToString
// over the dyn kind, InvalidCharacterError throws, latin1 domain).
// typeof answers 'function' for stdlib globals (the identity-token
// story folds before the operand lowers).
'use strict';
const assert = require('assert');
console.log(typeof DOMException, typeof queueMicrotask, typeof atob);
console.log(btoa('abc'), atob('YWJjZA=='), atob(' '), atob('  Y\fW\tJ\njZ A=\r= '));
console.log(atob(null), atob(1234).length);
assert.throws(() => atob('a'), DOMException);
assert.throws(() => { atob('我要抛错！'); }, DOMException);
const d = new DOMException('no cause', 'abc');
console.log(d.name, d.message, d.code, 'cause' in d, d.cause === undefined);
const d2 = new DOMException('with string cause', { name: 'abc', cause: 'foo' });
console.log(d2.name, 'cause' in d2, d2.cause);
const d3 = new DOMException('m', 'InvalidCharacterError');
console.log(d3.code, d3.toString(), d3 instanceof DOMException, d3 instanceof Error);
const d4 = new DOMException();
console.log(JSON.stringify(d4.name), JSON.stringify(d4.message), d4.code);
try { btoa('éĀ'); } catch (e) { console.log(e.name, e.code, e.message); }
try { atob('a'); } catch (e) { console.log(e.name, e.code, e.message); }
console.log('ok');
