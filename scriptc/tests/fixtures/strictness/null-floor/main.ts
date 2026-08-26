/* The program is trivial on purpose: what must fail here is the CONFIG.
 * strictNullChecks is scriptc's floor — null/undefined are distinct
 * static types in the value model — so a project that disables it gets
 * the SC0002 diagnostic instead of silent adoption (or silent
 * re-enabling). */
console.log("never compiles");
