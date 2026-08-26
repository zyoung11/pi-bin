// process.env writes: setenv semantics — later reads observe the write,
// children inherit it, and the computed-key form works. Node's value is
// always a string.
import { spawnSync } from "node:child_process";

console.log("before:", process.env.SCRIPTC_WRITE_TEST ?? "(unset)");
process.env.SCRIPTC_WRITE_TEST = "written";
console.log("after:", process.env.SCRIPTC_WRITE_TEST ?? "(unset)");

// Overwrite.
process.env.SCRIPTC_WRITE_TEST = "rewritten";
console.log("overwrite:", process.env.SCRIPTC_WRITE_TEST ?? "(unset)");

// Computed keys.
const key = "SCRIPTC_" + "DYNAMIC_KEY";
process.env[key] = "via-brackets";
console.log("computed:", process.env["SCRIPTC_DYNAMIC_KEY"] ?? "(unset)");

// A written variable reaches spawned children through the inherited env.
const out = spawnSync("sh", ["-c", "printf %s \"$SCRIPTC_WRITE_TEST\""], { encoding: "utf8" }).stdout;
console.log("child sees:", out);

// Non-literal values.
const n = 2;
process.env.SCRIPTC_WRITE_TEST = `n=${n * 3}`;
console.log("template:", process.env.SCRIPTC_WRITE_TEST ?? "(unset)");
