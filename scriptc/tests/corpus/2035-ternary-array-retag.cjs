// The pwdCommand shape (test/common/index.js): a ternary of array literals
// where one arm nests an EMPTY literal — tsc types the empty `[]` never[],
// and the join must not fence on the uninhabited element representation.
// The filled arm builds as the sibling's (string | string[])[] and the
// nested empty literal adopts the union's single array arm.
'use strict';
const isWindows = process.platform === 'win32';
const pwdCommand = isWindows ?
  ['cmd.exe', ['/d', '/c', 'cd']] :
  ['pwd', []];
console.log(pwdCommand.length);
console.log(Array.isArray(pwdCommand[1]));
console.log(JSON.stringify(pwdCommand));

// The reversed arm order (empty-nesting arm FIRST — the else arm is the
// sibling that decides): the filled arm still lends its type.
const other = !isWindows ?
  ['sh', []] :
  ['cmd.exe', ['/d']];
console.log(JSON.stringify(other));

// A nested empty literal in a PLAIN array literal under the same union
// element shape, no ternary involved.
const table = [['a', ['b', 'c']], ['d', []]];
console.log(JSON.stringify(table));
