// @transform-types
import { Geo } from "./geo.ts";
import G = Geo;

console.log("main body start");
console.log(Geo.dist(3, 10), Geo.origin);
const p = new Geo.P(-4);
console.log(p.away());
console.log(Geo.Deep.label);
console.log(G.dist(1, 5));
const q = new G.P(9);
console.log(q.away(), q instanceof Geo.P);
