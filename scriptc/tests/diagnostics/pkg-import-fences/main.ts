// The pointed SC1010 fences: every bare import that is not a supported
// builtin and not an npm package names ITS story — the ambient-only type
// surface (exact and pattern declare-module names), the types-only project
// resolution (an imports-field alias landing on a .d.ts), and the plain
// not-installed package (a "#" alias nothing maps).
///<reference path="decls.d.ts" />
import { x } from "ambientonly";
import { y } from "patternXmod";
import { t } from "#types";

console.log(x, y, t);
