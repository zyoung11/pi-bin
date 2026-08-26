// Optional record fields (`a?: T`): literals may omit them (the field holds
// undefined), explicit `a: undefined` is the same thing, reads narrow with
// === / !== undefined in both branches, and writes flip between the value
// arm and undefined. Interfaces, type aliases, and inline annotations all
// spell the same shapes.
interface User {
  name: string;
  nickname?: string;
}
const ada: User = { name: "ada" };
const bob: User = { name: "bob", nickname: "bo" };
const cyd: User = { name: "cyd", nickname: undefined };
console.log(ada.name, bob.name, cyd.name);
console.log(ada.nickname === undefined, bob.nickname === undefined, cyd.nickname === undefined);

// narrowing reads in both branches
function label(u: User): string {
  if (u.nickname !== undefined) {
    return u.name + " aka " + u.nickname;
  }
  return u.name + " (no nickname)";
}
console.log(label(ada));
console.log(label(bob));

// writes: value arm, then back to undefined
ada.nickname = "lovelace";
if (ada.nickname !== undefined) {
  console.log("now", ada.nickname, ada.nickname.length);
}
ada.nickname = undefined;
console.log(ada.nickname === undefined);

// multiple optional fields; a type alias; omit any subset
type Point = { x: number; y?: number; tag?: string };
const p1: Point = { x: 1 };
const p2: Point = { x: 2, y: 20 };
const p3: Point = { tag: "t3", x: 3 };
console.log(p1.x, p2.x, p3.x);
console.log(p1.y === undefined, p2.y !== undefined, p3.y === undefined);
if (p2.y !== undefined) {
  console.log(p2.y + p2.x);
}
if (p3.tag !== undefined) {
  console.log(p3.tag);
}

// optional number/boolean fields exercise the scalar payload arms
type Flags = { on?: boolean; level?: number };
const f0: Flags = {};
const f1: Flags = { on: true, level: 2 };
console.log(f0.on === undefined, f0.level === undefined);
if (f1.on !== undefined && f1.level !== undefined) {
  console.log(f1.on, f1.level * 10);
}

// nested: an optional field inside a nested record, and records with
// optional fields flowing through functions and returns
type Config = { name: string; retry?: number };
type App = { cfg: Config; id: number };
const app: App = { cfg: { name: "svc" }, id: 7 };
console.log(app.cfg.name, app.cfg.retry === undefined, app.id);
app.cfg = { name: "svc2", retry: 3 };
if (app.cfg.retry !== undefined) {
  console.log(app.cfg.name, app.cfg.retry);
}

function mkConfig(name: string, retry: number): Config {
  if (retry < 0) {
    return { name };
  }
  return { name, retry };
}
const c1 = mkConfig("a", -1);
const c2 = mkConfig("b", 5);
console.log(c1.retry === undefined, c2.retry !== undefined);

// shorthand properties can fill an optional slot
const nickname = "shorty";
const s: User = { name: "sho", nickname };
if (s.nickname !== undefined) {
  console.log(s.nickname);
}

// reference semantics: aliases see optional-field mutations
const alias: User = s;
alias.nickname = undefined;
console.log(s.nickname === undefined, s === alias);
