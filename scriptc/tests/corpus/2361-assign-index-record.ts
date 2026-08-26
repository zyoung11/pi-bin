// Object.assign INTO an index-signature record — the init-config merge
// pattern (`const config: Record<string, unknown> = { ...defaults };
// Object.assign(config, entry.initConfig)`): each source's keys keyed-
// write into the target (declared fields in declaration order, then the
// overflow in JS own-key order), the result IS the target. And the bare
// utf-8 encoding argument of writeFileSync — the options record's
// encoding key alone, the write Node does by default anyway.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Merging fixed-shape sources into a Record<string, unknown> target.
const base: Record<string, unknown> = { kept: true };
const github = { github: { users: ["octocat"], repos: 2 } };
const slack = { slack: { channels: ["general", "random"] } };
Object.assign(base, github, slack);
console.log(Object.keys(base).join(","));
console.log(JSON.stringify(base));

// The merge mutates the TARGET in place (identity, like JS): reads
// through the original binding see the merged keys.
Object.assign(base, { extra: 1 });
console.log(JSON.stringify(base["extra"]));

// An index-signature SOURCE merges its runtime keys in own-key order.
const dynamic: Record<string, unknown> = {};
dynamic["z"] = "last";
dynamic["a"] = "first";
const target2: Record<string, unknown> = { pre: 0 };
Object.assign(target2, dynamic);
console.log(Object.keys(target2).join(","));
console.log(JSON.stringify(target2));

// Same-key collisions: later sources win, like JS.
const collide: Record<string, unknown> = { x: 1 };
Object.assign(collide, { x: 2 }, { x: 3 });
console.log(JSON.stringify(collide));

// Number-valued signatures merge without the dyn detour.
const counts: Record<string, number> = { a: 1 };
Object.assign(counts, { b: 2, c: 3 });
console.log(Object.keys(counts).join(","), counts["b"]! + counts["c"]!);

// writeFileSync(path, data, "utf-8"): the bare-encoding spelling.
const dir = mkdtempSync(join(tmpdir(), "scr-corpus-"));
const file = join(dir, "config.yaml");
writeFileSync(file, "tokens:\n  admin: 1\n", "utf-8");
console.log(readFileSync(file, "utf-8"));
writeFileSync(file, "second", "utf8");
console.log(readFileSync(file, "utf8"));
rmSync(dir, { recursive: true, force: true });
