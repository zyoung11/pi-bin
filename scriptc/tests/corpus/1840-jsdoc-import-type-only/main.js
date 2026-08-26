// A class instance type reaching the entry PURELY through a jsdoc
// `typeof import('./base')` over a module never imported at value level:
// the class never enters the lowered program, so its instance type is
// unmappable and the annotated functions fall back to the JS dynamic
// param — Node-exact, where this shape used to ICE the IR validator
// (SC9001 `global "test" names undeclared class "Base"`, the 2026-07-20
// sweep's signature 01, minimized from
// jsDeclarationsParameterTagReusesInputNodeInEmit2).

/** @typedef {typeof import('./base')} BaseFactory */

/** @param {ReturnType<typeof import("./base")>} b */
const test = (b) => b;

/**
 * @param {InstanceType<BaseFactory["Base"]>} base
 * @returns {InstanceType<BaseFactory["Base"]>}
 */
const roundtrip = (base) => {
    return base;
};

console.log(typeof test);
console.log(typeof roundtrip);
console.log(test(42));
console.log(roundtrip("still here"));
