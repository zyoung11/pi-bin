'use strict';
// The JS-entry spelling of the dyn assert surface — untyped JS's most
// common assert form: require('assert'), JSON.parse products compared
// against literals with strictEqual/deepStrictEqual, truthiness through
// the callable module. Messages must match Node byte for byte.
const assert = require('assert');

function msgOf(fn) {
  try {
    fn();
    return 'PASS';
  } catch (e) {
    return e instanceof Error ? `${e.name}|${JSON.stringify(e.message)}` : 'not an Error';
  }
}

const cfg = JSON.parse('{"port":8080,"host":"localhost","debug":false,"tags":["a","b"]}');
assert.strictEqual(cfg.port, 8080);
assert.strictEqual(cfg.host, 'localhost');
assert.strictEqual(cfg.debug, false);
assert.deepStrictEqual(cfg.tags, ['a', 'b']);
assert.notStrictEqual(cfg.port, 8081);
assert(cfg.port);
assert.ok(cfg.host, 'host must be set');
console.log('cjs passes ok');

console.log(msgOf(() => assert.strictEqual(cfg.port, 8081)));
console.log(msgOf(() => assert.strictEqual(cfg.host, 'remote')));
console.log(msgOf(() => assert.strictEqual(cfg.debug, 'false')));
console.log(msgOf(() => assert.deepStrictEqual(cfg.tags, ['a', 'c'])));
console.log(msgOf(() => assert.notStrictEqual(cfg.port, 8080)));
console.log(msgOf(() => assert.strictEqual(cfg.tags, cfg.port)));

const dz = JSON.parse('{"x":1}');
console.log(msgOf(() => assert.strictEqual(cfg.tags, dz)));
console.log(msgOf(() => assert.deepStrictEqual(dz, JSON.parse('{"x":1,"y":2}'))));
console.log('cjs done');
