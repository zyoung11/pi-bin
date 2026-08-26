// process.env as a WHOLE value: an index-signature record snapshot over
// environ — spreads into records, bracket reads through the snapshot, and
// Object.keys membership. The harness pins SCRIPTC_TEST_ENV=from-harness
// in both lanes.
const env: Record<string, string | undefined> = { ...process.env };
console.log("known:", env["SCRIPTC_TEST_ENV"] ?? "(unset)");
console.log("path set:", (env["PATH"] ?? "") !== "");
console.log("absent:", env["SCRIPTC_DEFINITELY_NOT_SET_XYZ"] ?? "(unset)");

// Spread with extra keys on top, the spawn-env pattern.
const merged: Record<string, string | undefined> = { ...process.env, SCRIPTC_EXTRA: "extra" };
console.log("merged extra:", merged["SCRIPTC_EXTRA"] ?? "(unset)");
console.log("merged known:", merged["SCRIPTC_TEST_ENV"] ?? "(unset)");

// The snapshot is a copy: writes to it do not touch the real environment.
merged["SCRIPTC_TEST_ENV"] = "shadowed";
console.log("shadowed:", merged["SCRIPTC_TEST_ENV"] ?? "(unset)");
console.log("real unchanged:", process.env.SCRIPTC_TEST_ENV ?? "(unset)");

// Object.keys over the snapshot sees the pinned variable.
const keys = Object.keys({ ...process.env });
console.log("has pinned key:", keys.includes("SCRIPTC_TEST_ENV"));
console.log("has PATH:", keys.includes("PATH"));
