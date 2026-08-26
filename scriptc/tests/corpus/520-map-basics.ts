// Map<string, number> basics: set/get/has/delete/size/clear, overwrite
// keeping the entry, and get-miss narrowing through the V | undefined union.
const m = new Map<string, number>();
console.log(m.size, m.has("a"));
m.set("a", 1);
m.set("b", 2);
m.set("c", 3);
console.log(m.size);
m.set("a", 10); // overwrite: size unchanged, value replaced
console.log(m.size, m.has("a"), m.has("nope"));

const hit = m.get("a");
if (hit !== undefined) {
  console.log("a =", hit, hit + 1);
}
const miss = m.get("nope");
console.log(miss === undefined, miss !== undefined);

// delete returns whether the key existed; a second delete misses.
console.log(m.delete("b"), m.delete("b"), m.size);
console.log(m.get("b") === undefined);

// deleted keys can come back
m.set("b", 20);
const back = m.get("b");
if (back !== undefined) {
  console.log("b =", back);
}

// keys are compared by CONTENT, not identity
const built = "a" + "";
console.log(m.has(built), m.get(built) !== undefined);

// empty-string and unicode keys are ordinary keys
m.set("", 0);
m.set("café ☕", 42);
console.log(m.has(""), m.has("café ☕"), m.size);

m.clear();
console.log(m.size, m.has("a"), m.get("a") === undefined);
// clear on an already-empty map is fine
m.clear();
console.log(m.size);

// string values: get returns the stored string, misses stay undefined
const s = new Map<string, string>();
s.set("greet", "hello");
const g = s.get("greet");
if (g !== undefined) {
  console.log(g.length, g + "!");
}

// boolean values ride the scalar slot
const flags = new Map<string, boolean>();
flags.set("on", true);
flags.set("off", false);
const off = flags.get("off");
if (off !== undefined) {
  console.log("off =", off);
}

// maps in functions: passed and returned like any reference value
function count(counts: Map<string, number>, key: string): number {
  const cur = counts.get(key);
  const next = cur === undefined ? 1 : cur + 1;
  counts.set(key, next);
  return next;
}
const counts = new Map<string, number>();
console.log(count(counts, "x"), count(counts, "x"), count(counts, "y"), counts.size);

// reference semantics: an alias sees mutations; === is identity
const alias = counts;
alias.set("z", 9);
console.log(counts.size, alias === counts);
const other = new Map<string, number>();
console.log(other === counts);
