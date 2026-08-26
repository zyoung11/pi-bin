// process.env reads: string | undefined unions off getenv(3). PATH exists
// everywhere the harness runs but its VALUE differs by machine, so it is
// tested for presence and narrowed use only; SCRIPTC_TEST_ENV is set by
// the differential harness for BOTH sides, so its value prints exactly.

console.log(process.env.PATH !== undefined);
console.log(process.env.SCRIPTC_DEFINITELY_NOT_SET_12345 === undefined);

// Value-exact round trip through the harness-set variable (unnarrowed
// union prints stay rejected — narrow first, then print the string arm).
const known = process.env.SCRIPTC_TEST_ENV;
if (known !== undefined) {
  console.log("known:", known, known.length);
}

// The element form takes computed keys and narrows the same way.
const name = "SCRIPTC_TEST" + "_ENV";
const dynamic = process.env[name];
if (dynamic !== undefined) {
  console.log("computed:", dynamic);
} else {
  console.log("computed: unset");
}

// Early-return / default pattern over an unset variable.
function envOr(key: string, dflt: string): string {
  const v = process.env[key];
  if (v === undefined) {
    return dflt;
  }
  return v;
}
console.log(envOr("SCRIPTC_TEST_ENV", "fallback"));
console.log(envOr("SCRIPTC_DEFINITELY_NOT_SET_12345", "fallback"));

// Narrowed member use: the PATH value itself never prints (machine-
// dependent), only derived booleans.
const path = process.env.PATH;
if (path !== undefined) {
  console.log("PATH nonempty:", path.length > 0);
}
