// assert.ifError over checked-dynamic values (test/common's mustSucceed
// wrapper): units pass quietly, error-encoded objects throw with the
// error's message, everything else with the value's inspection.
'use strict';
const assert = require('assert');
function mustSucceed(fn) { return function (err, v) { assert.ifError(err); return fn(v); } }
mustSucceed((v) => console.log('ok', v))(null, 42);
mustSucceed((v) => console.log('ok2', v))(undefined, 7);
try { mustSucceed(() => {})(new TypeError('boom')); } catch (e) { console.log(e.message); }
try { mustSucceed(() => {})('plain'); } catch (e) { console.log(e.message); }
try { mustSucceed(() => {})(0); } catch (e) { console.log(e.message); }
