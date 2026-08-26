import { base, bump, counter, Tally } from "./util.ts";
console.log("main start", base, counter);
bump();
bump();
// live binding: the importer sees the exporter's mutations
console.log("after bumps", counter);
const t = new Tally("t");
console.log(t.add(base), t.add(counter));
const alias = bump;
console.log(alias(), counter, alias === bump);
