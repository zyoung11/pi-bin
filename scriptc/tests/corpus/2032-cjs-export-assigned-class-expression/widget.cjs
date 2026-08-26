// The NAMED spelling: the expression's own name is the JS-observable
// .name, statics resolve through the module.exports spelling, and the
// static method call devirtualizes like a direct class name.
module.exports = class Widget {
  constructor() {
    this.kind = "widget";
  }
  static describe() {
    return "a widget";
  }
};
console.log("widget in-file:", module.exports.name, module.exports.describe(), new module.exports().kind);
