// Regex value flow + result churn: interned literals through params,
// returns, records, closures, and arrays of results — the SAN lane's RC
// audit proves nothing leaks and nothing double-frees.
function apply(r: RegExp, s: string): string {
  return s.replace(r, "*");
}

function chooser(strict: boolean): RegExp {
  return strict ? /^\d+$/ : /\d+/;
}

const validators = { id: /^[a-z]+-\d+$/, word: /^\w+$/ };

let hits = 0;
let acc = "";
for (let i = 0; i < 500; i++) {
  const s = "item-" + i;
  if (validators.id.test(s)) hits = hits + 1;
  const cleaned = apply(/-\d+$/, s);
  const parts = s.split(/-/);
  acc = cleaned + ":" + parts.length;
}
console.log(hits, acc);

// Same literal in a loop is ONE interned regex; results are fresh strings.
const pieces: string[] = [];
for (let i = 0; i < 50; i++) {
  pieces.push("x1y2z".replace(/\d/g, `${i}`.slice(0, 1)));
}
console.log(pieces.length, pieces[0], pieces[49]);

// Closures capturing a regex-typed binding.
let re = /a/;
const test = (s: string): boolean => re.test(s);
console.log(test("cat"), test("dog"));
re = /o/;
console.log(test("cat"), test("dog"));

console.log(chooser(true).test("123"), chooser(true).test("12x"), chooser(false).test("a12b"));

// Regexes survive try/catch unwinding around a throwing regex op.
let state = "start";
try {
  const r = /q/;
  state = "abc".replaceAll(r, "-"); // no /g: throws
} catch {
  state = "recovered";
}
console.log(state, /q/.source);
