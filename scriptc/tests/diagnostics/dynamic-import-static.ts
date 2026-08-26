// Dynamic import() in a STATIC build: every site is its own SC2012 — the
// module's execution home is the embedded engine, so the honest story is
// the requires---dynamic diagnostic, per site, poison-recovered.
async function run(): Promise<void> {
  const fs = await import("fs");
  console.log(fs ? "y" : "n");
  const p = await import("node:path");
  console.log(p ? "y" : "n");
}
run();
