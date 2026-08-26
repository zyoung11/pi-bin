// `${u}` (and `u + "s"`) where u is a UNION — the per-union ToString helper,
// differentially vs Node: unit arms print "undefined"/"null", string arms
// pass through, number/bool arms use the JS-exact formatters. Unions with
// object arms stay fenced (JS would print "[object Object]").

function pick(n: number): string | undefined {
  return n > 0 ? "yes" : undefined;
}
console.log(`one=${pick(1)} two=${pick(-1)}`);

let sn: string | null = null;
console.log(`sn=${sn}`);
sn = "set";
console.log(`sn=${sn}`);

// number | string via a call (no unit arms).
function mk(flip: boolean): number | string {
  return flip ? 42.5 : "forty-two";
}
console.log(`mk=${mk(true)} / ${mk(false)}`);

// Three arms including both units, reassigned through every arm.
let t: string | null | undefined = undefined;
console.log(`t=${t}`);
t = null;
console.log(`t=${t}`);
t = "value";
console.log(`t=${t}`);

// bool and number arms; JS-exact number formatting through the union.
let bu: boolean | undefined = undefined;
console.log(`bu=${bu}`);
bu = false;
console.log(`bu=${bu}`);
function num(n: number): number | null {
  return n >= 0 ? n : null;
}
console.log(`a=${num(0)} b=${num(-0)} c=${num(0.1 + 0.2)} d=${num(1e21)} e=${num(-1)}`);
const nanU: number | undefined = 0 / 0;
const infU: number | null = 1 / 0;
console.log(`nan=${nanU} inf=${infU}`);

// Wide mixed union.
function wide(k: number): string | number | boolean | null | undefined {
  if (k === 0) return "s";
  if (k === 1) return 3.5;
  if (k === 2) return true;
  if (k === 3) return null;
  return undefined;
}
for (let k = 0; k < 5; k++) {
  console.log(`wide(${k})=${wide(k)}`);
}

// String concatenation coerces through the same helper.
const plus = "v: " + pick(1) + " / " + pick(-1);
console.log(plus);
console.log(pick(-1) + "!");

// Record fields and optional fields as template operands.
interface Entry {
  id: string;
  released?: number;
  note?: string | null;
}
const e1: Entry = { id: "a" };
const e2: Entry = { id: "b", released: 7.25, note: null };
console.log(`${e1.id}: released=${e1.released} note=${e1.note}`);
console.log(`${e2.id}: released=${e2.released} note=${e2.note}`);

// Template results are ordinary strings.
const s = `[${pick(-1)}]`;
console.log(s.length, s.startsWith("[undefined"));
