// A CJS export table with getters that read SIBLING getters through
// `this` (Node binds the getter receiver to module.exports — the
// test/common idiom), lazy-caching through a file-scope let, and a
// nested BUILTIN require inside a getter body (pure alias plumbing —
// builtins load nothing).
'use strict';

let cached = null;

module.exports = {
  get base() {
    return 2;
  },
  get doubled() {
    return this.base * 2;
  },
  get viaCache() {
    if (cached !== null) return cached;
    if (this.doubled === 4) {
      cached = 'four';
    } else {
      cached = 'other';
    }
    return cached;
  },
  get joined() {
    const { join } = require('path');
    return join('a', 'b');
  },
};
