// Maps holding reference values: records, class instances, arrays, and
// union values. Values alias (reference semantics through get), overwrites
// release the old value (the sanitized lane proves it), and maps ride
// class fields, parameters, and returns like any refcounted value.
interface Point {
  x: number;
  y: number;
}
const pts = new Map<string, Point>();
pts.set("origin", { x: 0, y: 0 });
pts.set("unit", { x: 1, y: 1 });
pts.set("origin", { x: 9, y: 9 }); // overwrite releases the old record
const o = pts.get("origin");
if (o !== undefined) {
  console.log(o.x, o.y);
  o.x = 100; // the map's value is the SAME record (aliasing)
}
const again = pts.get("origin");
if (again !== undefined) {
  console.log("aliased:", again.x);
}

// class instances as values, map stored in a class field
class Registry {
  items: Map<string, Point>;
  label: string;
  constructor(label: string) {
    this.items = new Map<string, Point>();
    this.label = label;
  }
  add(name: string, p: Point): void {
    this.items.set(name, p);
  }
  total(): number {
    let t = 0;
    this.items.forEach((p) => {
      t = t + p.x + p.y;
    });
    return t;
  }
}
const reg = new Registry("main");
reg.add("a", { x: 1, y: 2 });
reg.add("b", { x: 3, y: 4 });
console.log(reg.label, reg.items.size, reg.total());

// arrays as values
const rows = new Map<string, number[]>();
rows.set("evens", [2, 4, 6]);
rows.set("odds", [1, 3, 5]);
const evens = rows.get("evens");
if (evens !== undefined) {
  evens.push(8); // aliases the stored array
  console.log(evens.join(","));
}
const evens2 = rows.get("evens");
if (evens2 !== undefined) {
  console.log("stored grew too:", evens2.length);
}

// union values: get() folds V's own undefined arm into ONE union
const opt = new Map<string, string | undefined>();
opt.set("present", "here");
opt.set("absent", undefined);
const p1 = opt.get("present");
if (p1 !== undefined) {
  console.log("present:", p1);
}
console.log(opt.get("absent") === undefined, opt.has("absent"));
console.log(opt.get("missing") === undefined, opt.has("missing"));

// discriminated-union values: forEach hands back the union, discriminant
// reads and narrowing work on it exactly as anywhere else. (get() on a
// record-union value returns the three-arm `Ok | Err | undefined`, whose
// sub-union narrowing is the documented SC2003 fence — iterate instead.)
interface Ok {
  kind: "ok";
  value: number;
}
interface Err {
  kind: "err";
  message: string;
}
const results = new Map<string, Ok | Err>();
results.set("first", { kind: "ok", value: 42 });
results.set("second", { kind: "err", message: "boom" });
console.log(results.has("first"), results.size);
results.forEach((v, k) => {
  if (v.kind === "ok") {
    console.log("result:", k, v.value);
  } else {
    console.log("result:", k, v.message);
  }
});

// maps passed and returned through functions; closures capture them
function invert(src: Map<string, number>): Map<number, string> {
  const out = new Map<number, string>();
  src.forEach((v, k) => {
    out.set(v, k);
  });
  return out;
}
const ages = new Map<string, number>();
ages.set("ada", 36);
ages.set("alan", 41);
const byAge = invert(ages);
const who = byAge.get(36);
if (who !== undefined) {
  console.log("36 is", who);
}

const cache = new Map<string, number>();
const memo = (k: string): number => {
  const hit = cache.get(k);
  if (hit !== undefined) {
    return hit;
  }
  const computed = k.length * 10;
  cache.set(k, computed);
  return computed;
};
console.log(memo("abc"), memo("abc"), cache.size);
