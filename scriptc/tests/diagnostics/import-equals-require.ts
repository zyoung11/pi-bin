// The require form of import= is a module edge with CommonJS interop
// semantics nothing lowers — fenced by name (the entity form is namespace
// alias plumbing and compiles).
import fs = require("fs");
console.log(fs.readFileSync("/dev/null", "utf8"));
