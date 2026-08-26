// Record basics: literals, field read/write, compound assignment and ++/--,
// nested records, records holding strings/arrays, reference semantics,
// identity, and named shapes (interface / type alias) sharing a struct with
// structurally identical anonymous literals.
const point = { x: 1, y: 2, label: "origin" };
console.log(point.x, point.y, point.label);
point.x = 10;
point.y += 5;
point.x++;
point.y--;
point.label += "!";
console.log(point.x, point.y, point.label);

// nested records and records of arrays/strings
const config = {
  name: "app",
  limits: { low: 0, high: 100 },
  tags: ["fast", "small"],
};
console.log(config.name, config.limits.low, config.limits.high);
config.limits.high = 250;
config.limits = { low: -1, high: 1 };
console.log(config.limits.low, config.limits.high);
config.tags.push("native");
console.log(config.tags.length, config.tags[2]);

// reference semantics: aliases see mutations; identity is per-object
interface Point {
  x: number;
  y: number;
}
const a: Point = { x: 3, y: 4 };
const alias: Point = a;
alias.x = 99;
console.log(a.x, a === alias, a !== alias);
const twin: Point = { x: 99, y: 4 };
console.log(a === twin, a.x === twin.x);

// interface, type alias (different member order), and anonymous literals all
// share one structural shape — assignable in every direction.
type Coord = { y: number; x: number };
const c: Coord = { y: 7, x: 6 };
const viaInterface: Point = c;
const anonymous = { x: 1, y: 1 };
const backToAlias: Coord = anonymous;
console.log(viaInterface.x, backToAlias.y, c === viaInterface);

// empty record: allocatable, comparable
const empty = {};
const empty2 = {};
console.log(empty === empty, empty === empty2);

// records in ternaries and bool fields
const flagged = { on: true, level: 2 };
const chosen = flagged.on ? { m: "yes" } : { m: "no" };
console.log(chosen.m, flagged.level);
