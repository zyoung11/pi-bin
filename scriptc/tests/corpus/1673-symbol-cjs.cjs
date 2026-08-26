// The JS lane: unannotated `const k = Symbol('...')` infers unique symbol
// (checkJs) and compiles for real — the countdown.js module prologue
// shape, plus registry identity and typeof, no annotations anywhere.
'use strict';
const kLimit = Symbol('limit');
const kCallback = Symbol('callback');
const kAnon = Symbol();

console.log(typeof kLimit);
console.log(kLimit.toString());
console.log(kCallback.toString());
console.log(kAnon.toString());
console.log(kLimit.description ?? '(absent)');
console.log(kAnon.description ?? '(absent)');
console.log(kLimit === kLimit);

const reg = Symbol.for('cjs.reg');
console.log(reg === Symbol.for('cjs.reg'));
console.log(Symbol.keyFor(reg) ?? '(none)');
console.log(Symbol.keyFor(kLimit) ?? '(none)');
console.log(reg.description ?? '(absent)');
