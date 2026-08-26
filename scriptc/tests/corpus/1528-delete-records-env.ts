// Statement-position delete: pure Record<string, T> keys (the env-copy
// sanitization idiom — an overflow Map delete, insertion order kept) and
// process.env keys (unsetenv — later reads, `in` tests, and spawned
// children observe the removal; a read tsc narrowed past the union still
// answers FRESH, the volatility rule).
const env: Record<string, string> = { PATH: "/bin", Path: "/dup", HOME: "/root", path: "/tri" };
for (const key of Object.keys(env)) {
  if (key !== "PATH" && key.toUpperCase() === "PATH") {
    delete env[key];
  }
}
console.log(JSON.stringify(env), Object.keys(env).join(","));
delete env.HOME;
console.log(JSON.stringify(env));
delete env["MISSING"]; // absent key: a no-op, like JS
console.log(Object.keys(env).length);
const counts: Record<string, number> = { a: 1, b: 2, c: 3 };
delete counts["b"];
console.log(JSON.stringify(counts), Object.keys(counts).join(""));

process.env.SCRIPTC_DEL_A = "alpha";
console.log(process.env.SCRIPTC_DEL_A, "SCRIPTC_DEL_A" in process.env);
delete process.env.SCRIPTC_DEL_A;
console.log(process.env.SCRIPTC_DEL_A === undefined, "SCRIPTC_DEL_A" in process.env);
// The write narrowed the read type; the delete makes the FRESH read the
// only honest answer (no stale fold).
process.env.SCRIPTC_DEL_B = "beta";
delete process.env.SCRIPTC_DEL_B;
console.log(process.env.SCRIPTC_DEL_B === undefined, process.env.SCRIPTC_DEL_B !== undefined);
const KEY = "SCRIPTC_DEL_C";
process.env[KEY] = "gamma";
console.log(process.env[KEY]);
delete process.env[KEY];
console.log(process.env[KEY] === undefined);
