// `module.exports = <negative number literal>` after top-level effects:
// the export global is assigned at the statement's source position, AFTER
// the log below — Node's evaluation order.
'use strict';

console.log('offset module evaluating');

module.exports = -2.5;
