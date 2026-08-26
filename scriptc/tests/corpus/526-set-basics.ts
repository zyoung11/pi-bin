// Set<T> basics: add/has/delete/size/clear, duplicate adds keeping one
// entry, string content keying, and number elements under SameValueZero.
const s = new Set<string>();
console.log(s.size, s.has("a"));
s.add("a");
s.add("b");
s.add("c");
console.log(s.size);
s.add("a"); // duplicate: size unchanged
console.log(s.size, s.has("a"), s.has("nope"));

// delete returns whether the element existed; a second delete misses.
console.log(s.delete("b"), s.delete("b"), s.size);

// deleted elements can come back
s.add("b");
console.log(s.has("b"), s.size);

// elements are compared by CONTENT, not identity
const built = "a" + "";
console.log(s.has(built));

// empty-string and unicode elements are ordinary elements
s.add("");
s.add("café ☕");
console.log(s.has(""), s.has("café ☕"), s.size);

s.clear();
console.log(s.size, s.has("a"));
// clear on an already-empty set is fine
s.clear();
console.log(s.size);

// number elements: SameValueZero — NaN matches NaN, -0 and +0 collapse
const nan = 0 / 0;
const inf = 1 / 0;
const n = new Set<number>();
n.add(nan);
console.log(n.has(nan), n.size);
n.add(-0);
console.log(n.has(0), n.has(-0), n.size);
n.add(0);
console.log(n.size);
n.add(1.5);
n.add(inf);
console.log(n.has(1.5), n.has(inf), n.has(-inf), n.size);

// sets in functions: passed and returned like any reference value
function addOnce(seen: Set<string>, key: string): boolean {
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}
const seen = new Set<string>();
console.log(addOnce(seen, "x"), addOnce(seen, "x"), addOnce(seen, "y"), seen.size);

// reference semantics: an alias sees mutations; === is identity
const alias = seen;
alias.add("z");
console.log(seen.size, alias === seen);
const other = new Set<string>();
console.log(other === seen);

// sets as record fields (the config-object pattern)
interface Registry {
  names: Set<string>;
  limit: number;
}
const reg: Registry = { names: new Set(), limit: 3 };
reg.names.add("alpha");
reg.names.add("beta");
console.log(reg.names.size, reg.names.has("alpha"), reg.limit);
