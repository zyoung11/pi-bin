// Object spread beyond identifier sources: side-effect-free property-chain
// sources copy field by field (narrowed union reads included), and the
// conditional-spread idiom `...(c ? { k: v } : {})` compiles as one
// conditional optional field at the spread's own position — the condition
// evaluates exactly once, the value only when the arm is taken, and the
// untaken arm behaves exactly like the absent key (JSON.stringify and the
// undefined reads agree with Node byte-for-byte).

interface Info {
  a: number;
  b: string;
}

function get(): { data?: Info } {
  return { data: { a: 1, b: "x" } };
}

const json = get();
if (json.data) {
  // A property-chain source (narrowed past `| undefined`): pure re-read.
  const merged = { ...json.data, b: json.data.b + "!" };
  console.log(merged.a, merged.b);
  // The source is untouched (fresh record).
  console.log(json.data.b);
}

interface Entry {
  id: string;
  name?: string;
  cw?: number;
  released?: number;
}

function mk(e: { id: string; name?: string; cw?: number; released?: number }): Entry {
  return {
    id: e.id,
    ...(e.name ? { name: e.name } : {}),
    ...(e.cw != null ? { cw: e.cw } : {}),
    ...(e.released != null ? { released: e.released } : {}),
  };
}

const m1 = mk({ id: "a", name: "N", cw: 5, released: 0 });
const m2 = mk({ id: "b" });
const m3 = mk({ id: "c", cw: 0 });
console.log(m1.id, m1.name ?? "-", m1.cw ?? -1, m1.released ?? -1);
console.log(m2.id, m2.name ?? "-", m2.cw ?? -1, m2.released ?? -1);
console.log(m3.id, m3.name ?? "-", m3.cw ?? -1, m3.released ?? -1);

// The untaken arm serializes like the absent key (Node drops both).
console.log(JSON.stringify(mk({ id: "d", name: "only" })));

// Side-effect discipline: the condition runs exactly once, the value only
// when the condition holds.
let condEvals = 0;
let valueEvals = 0;
function cond(answer: boolean): boolean {
  condEvals++;
  return answer;
}
function value(): string {
  valueEvals++;
  return "V";
}
const took: { id: string; name?: string } = { id: "t", ...(cond(true) ? { name: value() } : {}) };
const skipped: { id: string; name?: string } = { id: "u", ...(cond(false) ? { name: value() } : {}) };
console.log(took.name ?? "-", skipped.name ?? "-", condEvals, valueEvals);

// The reversed orientation: the empty arm first.
function alt(flag: boolean): { id: string; tag?: string } {
  return { id: "r", ...(flag ? {} : { tag: "off" }) };
}
console.log(alt(true).tag ?? "-", alt(false).tag ?? "-");

// Shorthand carrier property.
function short(label: string | undefined): { id: string; label?: string } {
  return { id: "s", ...(label ? { label } : {}) };
}
console.log(short("L").label ?? "-", short(undefined).label ?? "-");
