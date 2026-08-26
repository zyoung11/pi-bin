// A bare require of a package NOTHING INSTALLED resolves throws Node's
// MODULE_NOT_FOUND Error at the require site — catchable, the
// optional-dependency try/require pattern (the ESM startup-crash
// channel's CJS runtime twin).
import { probe } from "./lib.cjs";
console.log(probe());
