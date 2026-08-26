// An EMPTY literal (and a partial one) flowing into a record whose missing
// fields are optional OR 'unknown': the unknown slot completes with the checked-dynamic tree
// undefined — exactly the absent-property read Node answers. the formatter idiom's
// getFileInfo(file, {}) against { plugins: unknown, ... } (a JS caller the
// checker admits; JSDoc types, no annotations).

/**
 * @typedef {{ ignorePath?: string, plugins: unknown, resolveConfig?: boolean, withNodeModules?: boolean }} FileInfoOptions
 */

/**
 * @param {FileInfoOptions} options
 * @returns {string}
 */
function describeOptions(options) {
  const ignore = options.ignorePath ?? "(none)";
  const rc = options.resolveConfig ?? false;
  const wnm = options.withNodeModules ?? false;
  return `${ignore} ${String(options.plugins)} ${rc} ${wnm}`;
}

/**
 * @param {string} file
 * @param {FileInfoOptions} [options]
 * @returns {string}
 */
function getFileInfoish(file, options = {}) {
  return `${file}: ${describeOptions(options)}`;
}

console.log(getFileInfoish("a.ts"));
console.log(getFileInfoish("b.ts", { plugins: ["p1"], resolveConfig: true }));
console.log(describeOptions({}));
