// The BARE "module" spelling — Node serves the builtin for both "module"
// and "node:module" (the builtin wins over any same-named npm package),
// so both spellings key the same lowering tables: createRequire's static
// erasure, the baked builtinModules list, and the require calls' own
// bare-or-prefixed specifiers all behave identically to the node:module
// twin (2631-create-require).
import { builtinModules, createRequire } from "module";

const require = createRequire(import.meta.url);

// A relative .json document through the bare-spelling binding.
const cfg = require("./cfg.json") as { name: string; port: number };
console.log("cfg:", cfg.name, cfg.port);

// Builtin requires through the bare-spelling require — themselves in
// both spellings.
const { join } = require("path") as typeof import("node:path");
const os = require("node:os") as typeof import("node:os");
console.log("path:", join("a", "b"), "os:", os.platform() === process.platform);

// builtinModules from the bare spelling is the same baked v24 list —
// which itself answers the spelling question: bare "module" is listed,
// "test" only under the node: prefix.
console.log(
  "builtins:",
  builtinModules.includes("module"),
  builtinModules.includes("node:module"),
  builtinModules.includes("test"),
  builtinModules.includes("node:test"),
);
