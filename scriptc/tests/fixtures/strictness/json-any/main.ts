/* Leans on the standard lib's any-typed JSON.parse (property reads straight
 * off the result, no checked cast) and rejects a Promise with a STRING
 * reason — both clean under this project's OWN tsc, both re-typed by
 * scriptc's divergence overrides (parse(): unknown; reject pins
 * `(reason: Error) => void`). Pins preflight's project-world second chance:
 * this program is ANALYZABLE (never a SC0001 wall). The unknown reads
 * LOWER now (the dyn keyed read, corpus 1544); what still fails at
 * lowering is the override-affected reject — the reason-coercion fence
 * for the string reason. A bound reject called with an Error is the
 * SUPPORTED surface and lowers cleanly. */
const pkg = JSON.parse('{"name":"demo"}');
if (typeof pkg.name === "string") {
  console.log(pkg.name);
}
const p: Promise<string> = new Promise((resolve, reject) => {
  resolve("done");
  reject(new Error("unused"));
});
const q: Promise<string> = new Promise((resolve, reject) => {
  reject("a bare string reason");
});
console.log("end");
