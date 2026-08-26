// `throw` of CHECKED-DYNAMIC values in JS files: the dyn node rides the
// exception cell BY REFERENCE — a caught dyn is the same node every other
// holder sees (assert.strictEqual against the original error answers
// true, the error-identity cache), scalar dyn throws re-materialize their
// values, and a rethrough try/finally keeps the payload intact.
'use strict';
const assert = require('assert');

function take(e) { throw e; }

const boom = new Error('boom');
try {
  take(boom);
} catch (err) {
  console.log('caught', err.name, err.message);
  assert.strictEqual(err, boom); // one error object, one dyn identity
  console.log('identity ok');
}

// Scalar dyn payloads come back as their values.
try {
  take('plain string');
} catch (err) {
  console.log('caught string:', err);
}
try {
  take(42);
} catch (err) {
  console.log('caught number:', err);
}

// A rethrow through finally keeps the same payload.
function relay(e) {
  try {
    take(e);
  } finally {
    console.log('finally ran');
  }
}
try {
  relay(boom);
} catch (err) {
  assert.strictEqual(err, boom);
  console.log('relay identity ok');
}
