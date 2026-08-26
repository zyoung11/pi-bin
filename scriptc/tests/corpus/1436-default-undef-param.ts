// A parameter default that may ITSELF be undefined (`x = process.env.FOO`):
// tsc keeps undefined in the body's type; a present argument passes
// through, an omitted one takes the default as-is — including staying
// undefined. The shouldPreviewAudio shape from a real CLI.
function report(label: string, value: string | undefined = process.env.SCRIPTC_TEST_ENV): string {
  return value === undefined ? `${label}:unset` : `${label}:${value}`;
}
console.log(report("set"));
console.log(report("explicit", "own"));
console.log(report("undef", undefined));

function reportUnset(v: string | undefined = process.env.SCRIPTC_TEST_UNSET_XYZ): string {
  return v === undefined ? "unset" : v;
}
console.log(reportUnset());

function maybe(n: number): string | undefined {
  return n > 0 ? `n${n}` : undefined;
}
function pick(n: number, v: string | undefined = maybe(n)): string {
  return v === undefined ? "none" : v;
}
console.log(pick(1));
console.log(pick(-1));
console.log(pick(5, "given"));
console.log(pick(-9, undefined));

// Defaults evaluate lazily (call-time, only when omitted/undefined).
let calls = 0;
function tick(): string | undefined {
  calls = calls + 1;
  return undefined;
}
function lazy(v: string | undefined = tick()): string {
  return v === undefined ? "u" : v;
}
console.log(lazy("x"));
console.log(calls);
console.log(lazy());
console.log(calls);
