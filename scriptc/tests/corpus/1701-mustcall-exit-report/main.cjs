// @exit: 1
// The mustCall FAILURE path: registrations left unsatisfied at exit make
// runCallChecks print Node's exact "Mismatched <name> function calls."
// report lines (util.format %s/%d substitution over the context the
// computed-key literal built) and process.exit(1). The replica's report
// omits the stack block (compiled binaries capture no stacks —
// SEMANTICS.md); stdout is Node byte-exact, exit code 1 on both.
'use strict';
const common = require('./common.cjs');

common.mustCall(function onNever() {}, 1);

const atLeast = common.mustCallAtLeast(function often() {}, 3);
atLeast();

const anon = common.mustCall(2);
anon();

console.log('end of main');
