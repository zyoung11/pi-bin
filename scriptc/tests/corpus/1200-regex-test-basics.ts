// Regex literals + test() + source/flags readbacks (static regex slice).
const re = /ab+c/;
console.log(re.test("xabbbcy"), re.test("abc"), re.test("ab"), re.test(""));

// Case-insensitive.
const ci = /hello/i;
console.log(ci.test("HeLLo world"), ci.test("help"));

// Multiline ^/$ vs plain.
console.log(/^b/.test("a\nb"), /^b/m.test("a\nb"));
console.log(/a$/.test("a\nb"), /a$/m.test("a\nb"));

// Dotall.
console.log(/a.b/.test("a\nb"), /a.b/s.test("a\nb"));

// Unicode property classes and astral matching under /u.
console.log(/\p{L}/u.test("é"), /\p{L}/u.test("123"));
console.log(/^.$/u.test("😀"), /^.$/.test("😀"));

// Character classes, alternation, anchors, escapes.
console.log(/^[a-f]+$/.test("decaf"), /^[a-f]+$/.test("decafg"));
console.log(/cat|dog/.test("hotdog"), /\d{3}-\d{4}/.test("call 555-0199 now"));

// source/flags readbacks (flags in source order).
const tagged = /t(a)g/gim;
console.log(tagged.source, tagged.flags);
console.log(/x/.flags === "", /\d+/u.source);

// Regexes are ordinary values: locals, params, returns, records.
function matches(r: RegExp, s: string): boolean {
  return r.test(s);
}
function pick(vowels: boolean): RegExp {
  return vowels ? /[aeiou]/ : /[^aeiou]/;
}
console.log(matches(/z$/, "fizz"), matches(pick(true), "sky"), matches(pick(false), "sky"));
const rules = { name: /^[A-Z][a-z]+$/, digits: /^\d+$/ };
console.log(rules.name.test("Ada"), rules.digits.test("40x"));
