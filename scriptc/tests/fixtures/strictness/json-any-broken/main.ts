/* A GENUINE type error alongside an override-manufactured one. The project
 * world (the program without scriptc's divergence overrides) rejects this
 * too, so preflight reports ITS errors — the ones reproducible with the
 * project's own tsc — and the override-manufactured 'unknown' complaint
 * never appears. */
const n: number = "not a number";
const pkg = JSON.parse('{"name":"demo"}');
console.log(pkg.name, n);
