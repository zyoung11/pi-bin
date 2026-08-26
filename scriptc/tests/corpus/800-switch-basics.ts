// switch fundamentals: matching, non-matching, default in the middle,
// fall-through chains, breaks, and string/bool discriminants.
function tag(n: number): string {
  switch (n) {
    case 1:
      return "one";
    case 2:
    case 3:
      return "two-or-three";
    default:
      return "many";
  }
}
console.log(tag(1), tag(2), tag(3), tag(9));

// default in the MIDDLE: entered only when every test misses, but
// fall-through runs it in source order when an earlier case matches.
function walk(n: number): void {
  switch (n) {
    case 1:
      console.log("case 1");
    default:
      console.log("default");
    case 2:
      console.log("case 2");
      break;
    case 3:
      console.log("case 3");
  }
  console.log("--");
}
walk(1); // case 1, default, case 2
walk(2); // case 2
walk(3); // case 3
walk(9); // default, case 2

// no default, no match: the whole body is skipped
const missing: number = 42;
switch (missing) {
  case 1:
    console.log("never");
}
console.log("skipped clean");

// empty switch (legal JS)
switch (missing) {
}

// string discriminant: strict content equality
function describe(word: string): string {
  switch (word) {
    case "a":
      return "article";
    case "run":
    case "walk":
      return "verb";
    default:
      return `unknown (${word})`;
  }
}
console.log(describe("a"), describe("walk"), describe("xyzzy"));
const empty: string = "";
switch (empty) {
  case "":
    console.log("empty string matches");
    break;
  default:
    console.log("no");
}

// bool discriminant (computed so the checker keeps it `boolean`, not `true`)
const flag: boolean = 1 < 2;
switch (flag) {
  case false:
    console.log("off");
    break;
  case true:
    console.log("on");
    break;
}

// NaN never matches (=== semantics); -0 matches 0
const nan: number = 0 / 0;
switch (nan) {
  case nan:
    console.log("matched NaN?!");
    break;
  default:
    console.log("NaN matches nothing");
}
const negZero: number = -0;
switch (negZero) {
  case 0:
    console.log("-0 === 0");
    break;
}

// case tests are arbitrary expressions
const base: number = 10;
const probe: number = 12;
switch (probe) {
  case base + 1:
    console.log("eleven");
    break;
  case base + 2:
    console.log("twelve");
    break;
}

// one shared lexical scope: a let declared in one case is the same binding
// in later cases (fall-through assigns and reads it).
const route: string = "b";
switch (route) {
  case "b":
    let note = `declared in b (${route})`;
    console.log(note);
  case "c":
    note = "reassigned in c";
    console.log(note);
    break;
  case "d":
    console.log("unreached");
}
