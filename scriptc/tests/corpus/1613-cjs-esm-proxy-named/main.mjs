// @exit: 1
// `module.exports = new Proxy(table, {})` — the checker resolves members
// through the Proxy TARGET, but Node's lexer sees `module.exports = <not
// a literal, not require(...)>` and detects NO named exports at all: a
// named import of any member is a link-time SyntaxError (the module still
// works through its default import, like 1615 works through require).
import { fixed } from './table.cjs';

console.log('never runs', fixed);
