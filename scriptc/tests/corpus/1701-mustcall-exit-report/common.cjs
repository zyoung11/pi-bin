// test/common's mustCall internals, shape-for-shape: the computed-key
// context object, inspect(new Error()) for the stack, the exit-time
// accounting ledger (module-level evolving array + process.on('exit')),
// the arguments-forwarding wrapper, and Object.defineProperties copying
// name/length onto it. Node is the oracle byte-for-byte.
'use strict';
const { inspect } = require('util');

const mustCallChecks = [];

function runCallChecks(exitCode) {
  if (exitCode !== 0) return;
  const failed = mustCallChecks.filter(function(context) {
    if ('minimum' in context) {
      context.messageSegment = `at least ${context.minimum}`;
      return context.actual < context.minimum;
    }
    context.messageSegment = `exactly ${context.exact}`;
    return context.actual !== context.exact;
  });
  failed.forEach(function(context) {
    console.log('Mismatched %s function calls. Expected %s, actual %d.',
                context.name,
                context.messageSegment,
                context.actual);
  });
  if (failed.length) process.exit(1);
}

function mustCall(fn, exact) {
  return _mustCallInner(fn, exact, 'exact');
}

function mustCallAtLeast(fn, minimum) {
  return _mustCallInner(fn, minimum, 'minimum');
}

function mustSucceed(fn, exact) {
  return mustCall(function(err, ...args) {
    if (err) throw err;
    if (typeof fn === 'function')
      return fn.apply(this, args);
  }, exact);
}

function _mustCallInner(fn, criteria = 1, field) {
  if (typeof fn === 'number') {
    criteria = fn;
    fn = noop;
  } else if (fn === undefined) {
    fn = noop;
  }
  if (typeof criteria !== 'number')
    throw new TypeError(`Invalid ${field} value: ${criteria}`);

  const context = {
    [field]: criteria,
    actual: 0,
    stack: inspect(new Error()),
    name: fn.name || '<anonymous>',
  };

  if (mustCallChecks.length === 0) process.on('exit', runCallChecks);

  mustCallChecks.push(context);

  const _return = function() {
    context.actual++;
    return fn.apply(this, arguments);
  };
  Object.defineProperties(_return, {
    name: {
      value: fn.name,
      writable: false,
      enumerable: false,
      configurable: true,
    },
    length: {
      value: fn.length,
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  return _return;
}

function noop() {}

function mustNotCall(msg) {
  return function mustNotCall(...args) {
    const argsInfo = args.length > 0 ?
      `\ncalled with arguments: ${args.map((arg) => inspect(arg)).join(', ')}` : '';
    throw new Error(`${msg || 'function should not have been called'}` + argsInfo);
  };
}

module.exports = { mustCall, mustCallAtLeast, mustSucceed, mustNotCall };
