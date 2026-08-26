// Generic values across modules: instantiations demanded from the importer,
// family statics shared program-wide, pinned generic-fn values imported.
import { Store, keep, local } from "./lib.ts";

const s = new Store<number>();
s.add(1).add(2);
const t = new Store<string>();
t.add("x");
console.log(s.items.join(","), t.items[0], Store.count, local.size);

const k: (x: number) => number = keep;
console.log(k(5), keep("direct"), s instanceof Store, local instanceof Store);
