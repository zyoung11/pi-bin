// ESM-importing-CJS default semantics: `import d from "./cjs"` binds d to
// module.exports (Node's interop rule) — table members read through the
// binding, scalar exports ARE the value.
import table from "./table.cjs";
import scalar from "./scalar.cjs";

console.log(table.seven, table.greet("x"));
console.log(scalar + 1);
