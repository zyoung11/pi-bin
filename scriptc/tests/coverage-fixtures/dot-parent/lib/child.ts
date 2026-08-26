// The bare '.' and '..' relative-specifier forms in the TS project
// dialect (vercel's CLI: `from '..'` at 41 sites): '..' is the parent
// DIRECTORY's index module, '.' this directory's own — exactly what the
// project's bundler-resolution checker answers, so preflight and the
// lowering resolve the same edges. (Node running raw TS would refuse a
// directory import in ESM; the compiled program is the tsc dialect —
// SEMANTICS.md's relative-specifier note.)
import { banner } from "..";
import { local } from ".";

export const title = banner + ":" + local + "!";
