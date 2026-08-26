// A WORKSPACE-LINKED package: node_modules/wslinked is a symlink whose
// realpath lies OUTSIDE every node_modules directory (the shape pnpm/npm/
// yarn/bun workspaces install for monorepo-internal packages). Node
// resolves it exactly like any installed package — through the link, to
// the package's exports-declared dist — and so must scriptc: the island
// embeds the shipped JS, and the realpath'd answer escaping node_modules
// must never read as "nothing installed resolves it".
import { describe, tag } from "wslinked";

console.log(describe(21));
console.log(tag(["a", "b", "c"]));
