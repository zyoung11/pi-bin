// JS file-scope object-literal consts live as ONE dyn object (identity is
// the literal's contract): the same node flows into untyped callees,
// their stamping is visible back through the binding, deep equality over
// the stamped object self-compares, and strictEqual over two crossings
// answers reference equality — the Node-suite trace-context idiom.
'use strict';
const assert = require('assert');

const input = { foo: 'bar' };
const other = { foo: 'bar' };

function stamp(x) {
  x.stamped = 42;
  return x;
}

const out = stamp(input);
console.log(input.stamped); // the callee's write is visible through the binding
assert.strictEqual(out, input); // same object through the call
assert.notStrictEqual(out, other); // content-equal is not identity
assert.deepStrictEqual(out, { foo: 'bar', stamped: 42 });
console.log('identity ok');

// Defaults and renames destructure off the same node.
const { foo, stamped: n, missing = 'dflt' } = input;
console.log(foo, n, missing);

// Nested literals ride along as members of the one node.
const cfg = { name: 'cfg', inner: { depth: 2 } };
function readDepth(c) { return c.inner.depth; }
console.log(readDepth(cfg), cfg.inner.depth);
