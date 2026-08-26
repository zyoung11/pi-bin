// `export * as sh` re-exports the module namespace under a name; the
// sibling named re-export rides the same statement machinery.
export * as sh from "./shared.ts";
export { helper as h2 } from "./shared.ts";
