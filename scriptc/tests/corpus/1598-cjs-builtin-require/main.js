// Builtin modules through CommonJS require: the namespace binding
// (`const path = require('path')`) and the destructured form key the same
// lowering tables as their ESM import twins.
'use strict';

const path = require('path');
const { basename, extname } = require('node:path');
const os = require('os');

const p = path.join("tmp", "deep", "file.tar.gz");
console.log(p);
console.log(path.dirname(p), basename(p), extname(p));
console.log(path.isAbsolute(p), path.isAbsolute("/root"));
console.log(JSON.stringify(os.EOL), path.sep);
