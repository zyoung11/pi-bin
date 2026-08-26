// @dynamic
// A workspace layout: the imported package is a SYMLINK into a pnpm/bun
// style virtual store, its dependency 'peer' lives beside its REAL store
// location (reached through another symlink, with import/require exports
// conditions and a './greet/*' subpath pattern), and 'hoistdep' is hoisted
// to the fixture-root node_modules — nowhere under the case directory.
import { describe } from "linked";

const out: string = describe(7);
console.log(out);
