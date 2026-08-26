// JS truthiness (ToBoolean): falsy numbers are 0, -0, NaN; falsy string is "".
// Also the value semantics of && / || — they return an operand, not a bool.

function checkNum(n: number): void {
  if (n) {
    console.log(n, "truthy");
  } else {
    console.log(n, "falsy");
  }
}
checkNum(0);
checkNum(-0);
checkNum(0 / 0); // NaN
checkNum(7);
checkNum(-3);
checkNum(0.001);

function checkStr(s: string): void {
  if (s) {
    console.log("nonempty:", s);
  } else {
    console.log("empty");
  }
}
checkStr("");
checkStr("hi");

// while on a number
let cnt: number = 3;
while (cnt) {
  console.log("cnt", cnt);
  cnt = cnt - 1;
}

// for-condition truthiness
for (let i: number = 2; i; i = i - 1) {
  console.log("for", i);
}

// ternary condition truthiness
// (tsc's strict "always truthy/falsy" checks reject literal conditions,
// so everything below goes through number/string-typed variables.)
const seven: number = 7;
const emptyStr: string = "";
console.log(seven ? "yes" : "no");
console.log(emptyStr ? "yes" : "no");

// ! and !! over numbers and strings
const nan: number = 0 / 0;
const zeroN: number = 0;
const oneN: number = 1;
const halfN: number = 0.5;
const negZeroN: number = -0;
console.log(!zeroN, !oneN, !halfN, !negZeroN);
console.log(!nan, !!nan);
const xStr: string = "x";
console.log(!emptyStr, !xStr, !!xStr);
console.log(!!seven);

// value-returning || idiom
function maybeEmpty(flag: boolean): string {
  if (flag) {
    return "value";
  }
  return "";
}
const label: string = maybeEmpty(false) || "default";
console.log(label);
const label2: string = maybeEmpty(true) || "default";
console.log(label2);

// value-returning && / || on numbers (falsy left keeps left, incl. -0 and NaN)
const zero: number = 0;
const negZero: number = -0;
console.log(zero && 5);
console.log(zero || 5);
console.log(negZero && 5);
console.log(negZero || 5);
console.log(nan && 5);
console.log(nan || 5);
console.log(seven && 5);
console.log(seven || 5);

// value-returning && / || on strings
const name: string = "world";
const empty: string = "";
console.log(name && `hello ${name}`);
console.log(empty && "never");
console.log(empty || "picked");
console.log(name || "never");

// booleans still work
const t: boolean = seven > 3;
console.log(t && seven < 10, t || seven < 0);

// short-circuit laziness of the value forms
function loudNum(tag: string, v: number): number {
  console.log("eval-num", tag);
  return v;
}
function loudStr(tag: string, v: string): string {
  console.log("eval-str", tag);
  return v;
}
console.log(seven || loudNum("skipped-or", 1));
console.log(seven && loudNum("taken-and", 2));
console.log(zero && loudNum("skipped-and", 3));
console.log(zero || loudNum("taken-or", 4));
console.log(empty && loudStr("skipped-and-s", "a"));
console.log(empty || loudStr("taken-or-s", "b"));
console.log(name && loudStr("taken-and-s", "c"));
console.log(name || loudStr("skipped-or-s", "d"));

// chained a || b || c (left-associative, first truthy wins)
const c1: string = "";
const c2: string = "";
const c3: string = "third";
console.log(c1 || c2 || c3);
console.log(c1 || "second" || c3);
console.log(zero || zeroN || 9);
console.log(oneN || loudNum("never", 8) || 9);

// strings flowing through && / || stay RC-clean (verified by the ASan lane)
let acc: string = "";
for (let i: number = 0; i < 4; i = i + 1) {
  acc = (acc || "seed") && (acc + "*");
}
console.log(acc);
