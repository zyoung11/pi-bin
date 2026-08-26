// String/Number/Boolean as VALUES: interned coercion closures with JS function identity — stored in records, compared with ===, and called with a string argument (the CLI option-table idiom).
const conv = String;
console.log(conv("hello"));
const toNum = Number;
console.log(toNum("3.5") + 1);
console.log(toNum("0x10"), toNum(""), toNum("  12  "), toNum("abc"));
const toBool = Boolean;
console.log(toBool(""), toBool("x"), typeof toBool);
console.log(conv === String, toNum === Number, toBool === Boolean);
console.log((conv as unknown) === (toNum as unknown));
const options = [
  { name: "project", type: String },
  { name: "count", type: Number },
  { name: "debug", type: Boolean },
];
for (const opt of options) {
  if (opt.type === String) console.log(opt.name, "takes a string");
  else if (opt.type === Number) console.log(opt.name, "takes a number");
  else console.log(opt.name, "is a flag");
}
const strOptions = [
  { name: "project", type: String },
  { name: "scope", type: String },
];
for (const opt of strOptions) {
  console.log(opt.name, opt.type("linked"));
}
function coerce(fn: (value: string) => string, raw: string): string {
  return fn(raw);
}
console.log(coerce(String, "passed through"));
