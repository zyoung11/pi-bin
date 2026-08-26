// A workspace tree that COPIES instead of symlinks: node_modules/wscopied
// is a real DIRECTORY (a byte copy of members/wscopied — some workspace
// installers copy members into node_modules), and the workspace ROOT's
// package.json declares the member through its "workspaces" globs. The
// realpath never escapes node_modules, so classification comes from the
// declared member list — and must land exactly where the SYMLINKED shape
// (workspace-unclean) does: the member registers as a workspace package,
// its missing declarations never gate the build (the implicit-any module
// error at this import is the author's own workspace code, not a
// missing-@types problem), and the island executes the shipped CJS. The
// copy stays node_modules JS, so the import surface is 'any' (the
// symlinked twin gets an inferred surface instead) — results exit
// through the usual typed boundaries.
import { describe } from "wscopied";

const out = describe(21) as string;
console.log(out);
