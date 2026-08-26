// JS catch variables under useUnknownInCatchVariables: a JS catch clause
// cannot annotate its variable, so the "'e' is of type 'unknown'" demand
// joins the JS relaxation — the value stays unknown and rides the
// checked-dynamic tree at its uses (member reads, String()), the suite's
// dominant catch shape (assert error-path tests).
'use strict';

try {
  throw new Error('boom');
} catch (e) {
  console.log(e.message);
  console.log(e.name);
  console.log(String(e));
}

function thrower(kind) {
  if (kind === 'type') {
    throw new TypeError('wrong kind');
  }
  throw new RangeError('out of range');
}

try {
  thrower('type');
} catch (err) {
  console.log(err.name);
  console.log(typeof err.message);
}

try {
  thrower('range');
} catch (err) {
  console.log(`${err.name}: ${err.message}`);
}

// Non-Error throws land as their own values, like Node.
try {
  throw 'plain string';
} catch (e) {
  console.log(typeof e, e);
}
