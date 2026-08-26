// CommonJS assert — the Node-test-suite shape: the whole-module require
// binding is callable AND carries the members; the destructured form and
// the node:-prefixed specifier bind the same lowerings.
'use strict';

const assert = require('assert');
const { strictEqual, deepStrictEqual, ok } = require('node:assert');

assert(true);
assert(1 + 1 === 2, 'arithmetic holds');
assert.ok('truthy');
assert.strictEqual('a' + 'b', 'ab');
assert.notStrictEqual(1, 2);
strictEqual(10 / 4, 2.5);
ok(!false);
deepStrictEqual({ list: [1, 2], name: 'x' }, { list: [1, 2], name: 'x' });
assert.deepStrictEqual(new Map([['k', 'v']]), new Map([['k', 'v']]));
assert.notDeepStrictEqual(new Set([1]), new Set([2]));
assert.throws(() => {
  throw new TypeError('cjs boom');
}, TypeError);
assert.match('release-1.2.3', /^release-\d/);
console.log('cjs assertions passed');

/** @param {() => void} f */
function messageOf(f) {
  try {
    f();
    return 'DID NOT THROW';
  } catch (e) {
    if (e instanceof Error) return `${e.name}: ${e.message}`;
    return 'not an Error';
  }
}
console.log(JSON.stringify(messageOf(() => assert(false))));
console.log(JSON.stringify(messageOf(() => assert.strictEqual(3, 4))));
console.log(JSON.stringify(messageOf(() => strictEqual('x', 'y'))));
console.log(JSON.stringify(messageOf(() => assert.fail('cjs failure'))));
console.log('done');
