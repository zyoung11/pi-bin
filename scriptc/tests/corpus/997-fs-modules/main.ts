// node:fs across modules: the entry file AND a helper module both import
// from "node:fs" (plus a relative import between them); the helper wraps
// the library behind ordinary exported functions.
import { existsSync, readFileSync } from "node:fs";
import { cleanup, countLines, saveLine, scratchDir } from "./store.ts";

const dir = scratchDir("tmp-997-");
console.log(existsSync(dir));

saveLine(dir, "log.txt", "alpha");
saveLine(dir, "log.txt", "beta");
saveLine(dir, "log.txt", "gamma");
console.log(countLines(dir, "log.txt"));

const raw = readFileSync(dir + "/log.txt", "utf8");
console.log(raw.startsWith("alpha"), raw.includes("beta"), raw.endsWith("gamma\n"));

// A helper's fs error propagates across the module boundary to this catch.
try {
  console.log("unreachable", countLines(dir, "absent.txt"));
} catch {
  console.log("caught cross-module fs error");
}

cleanup(dir);
console.log(existsSync(dir));
