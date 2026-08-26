const parent = require(".."); // the case directory -> package.json main -> shared.cjs
const self = require("."); // this directory -> sub/package.json main -> index.cjs
module.exports.report = function () {
  return parent.tag + ":" + self.name;
};
