// bool === / !== bool: plain value compares (the config-drift shape
// `desired.lanMode !== actual.lanMode`), through fields, params, unions
// narrowed to bool, and negation.
interface Cfg {
  lan: boolean;
  https: boolean;
}
const desired: Cfg = { lan: true, https: false };
const actual: Cfg = { lan: false, https: false };
console.log(desired.lan !== actual.lan, desired.https !== actual.https);
console.log(desired.lan === actual.lan, desired.https === actual.https);

function drift(a: Cfg, b: Cfg): number {
  let n = 0;
  if (a.lan !== b.lan) n++;
  if (a.https !== b.https) n++;
  return n;
}
console.log(drift(desired, actual), drift(desired, desired));

// Locals and expressions on both sides.
const t = 3 > 2;
const f = "a".length === 2;
console.log(t === f, t !== f, t === !f);

// A `boolean | undefined` narrowed to boolean compares as bool.
function pick(v: boolean | undefined, other: boolean): string {
  if (v !== undefined && v === other) return "same";
  return "diff";
}
console.log(pick(true, true), pick(undefined, true), pick(false, true));
