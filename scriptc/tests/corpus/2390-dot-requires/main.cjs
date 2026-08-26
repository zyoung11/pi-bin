// The bare '.' and '..' relative-specifier forms (Node's CJS resolution
// treats them exactly like './' and '../' directory imports: the target
// directory's package.json "main", else its index file) — a real CLI
// spells `from '..'` at 41 sites, and the CJS require twin is the form
// Node itself runs, so this case pins both lanes byte-for-byte.
const child = require("./sub/child.cjs");
console.log(child.report());
