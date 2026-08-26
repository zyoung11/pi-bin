// `require.main?.filename` — the CommonJS entry-module identity read. In a
// compiled binary require.main IS the entry module, so the chain folds to
// the entry file's compile-time path (the __filename stance), the guard
// drops (never undefined in a CJS graph), and string methods dispatch on
// the folded string even though the checker types the chain
// `string | undefined`. This is the suite harness's skip() shape:
// process.exit(require.main?.filename.startsWith(<known_issues>) ? 1 : 0).
'use strict';
const path = require('path');

console.log('M1', require.main?.filename === __filename);
console.log('M2', typeof require.main?.filename);
console.log('M3', require.main?.filename.startsWith(path.resolve(__dirname, '../known_issues/')) ? 1 : 0);
console.log('M4', require.main?.filename.endsWith('.cjs'));
process.exit(require.main?.filename.startsWith(path.resolve(__dirname, '../known_issues/')) ? 1 : 0);
