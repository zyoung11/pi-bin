// Named ESM imports of CJS exports Node's lexer CAN detect — every shape
// here must keep running (1616/1618 pin the invisible complements):
// shorthand and identifier-valued table keys, exports.dot / module.
// exports.dot assignments, a call-valued key (the key is added BEFORE the
// call expression stops the table scan), the head of a table whose getter
// stops the scan (bump lexes, `value` does not — it reads through the
// DEFAULT import, always module.exports itself, live through the
// accessor), and the head of a table where a space before the comma stops
// the scan (`{ a: b , c: d }` exports only `a`).
import { add as plus, ANSWER } from './shorthand.cjs';
import { first, second } from './assigns.cjs';
import { six } from './callval.cjs';
import { bump } from './getterhead.cjs';
import gh from './getterhead.cjs';
import { a } from './wscomma.cjs';

console.log(plus(20, 22), ANSWER);
console.log(first);
console.log(second);
console.log(six);
console.log(gh.value);
bump('second');
console.log(gh.value);
console.log(a);
