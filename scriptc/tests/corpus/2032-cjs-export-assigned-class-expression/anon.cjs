// The ANONYMOUS export-assigned class expression (the
// jsDeclarationsExportAssignedClassExpressionAnonymousWithSub shape):
// `module.exports = class {}` IS the module's export, `module.exports.Sub`
// attaches a second property-assigned class, and the Sub instance field
// constructs the exported class through the `module.exports` spelling.
module.exports = class {
  static label = "anon-export";
  constructor(p) {
    this.t = 12 + p;
  }
};
module.exports.Sub = class {
  constructor() {
    this.instance = new module.exports(10);
  }
};
// In-file reads of the replaced export: the class value, its
// NamedEvaluation name (""), a static field, and instanceof through it.
console.log("anon:", module.exports.name, module.exports.label);
console.log("anon in-file:", new module.exports(5).t, new module.exports(0) instanceof module.exports);
