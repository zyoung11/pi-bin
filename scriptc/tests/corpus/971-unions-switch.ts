// Switch over union discriminants: case bodies see the narrowed arm, an
// exhaustive switch needs no trailing return, defaults and fall-through
// keep their JS-exact behavior, and numeric literal discriminants work.
type Shape =
  | { tag: "circle"; r: number }
  | { tag: "rect"; w: number; h: number }
  | { tag: "line"; len: number };

// Classic Result-style exhaustive switch: every case returns, no default,
// no trailing return — tsc proves exhaustiveness, so does the compiler.
function area(s: Shape): number {
  switch (s.tag) {
    case "circle":
      return 3 * s.r * s.r;
    case "rect":
      return s.w * s.h;
    case "line":
      return 0;
  }
}

console.log(area({ tag: "circle", r: 2 }), area({ tag: "rect", w: 3, h: 4 }), area({ tag: "line", len: 9 }));

// Default clause + fall-through: entering "rect" falls into default.
function describe(s: Shape): string {
  let out = "";
  switch (s.tag) {
    case "circle":
      out = out + "round ";
      break;
    case "rect":
      out = out + "boxy ";
    default:
      out = out + "flat";
  }
  return out;
}
console.log(describe({ tag: "circle", r: 1 }));
console.log(describe({ tag: "rect", w: 1, h: 1 }));
console.log(describe({ tag: "line", len: 1 }));

// Numeric literal discriminants (f64 kind).
type Cmd = { op: 0; label: string } | { op: 1; delta: number } | { op: 2; label: string };
function run(c: Cmd): string {
  switch (c.op) {
    case 0:
      return "start " + c.label;
    case 1:
      return `move ${c.delta}`;
    case 2:
      return "stop " + c.label;
  }
}
console.log(run({ op: 0, label: "a" }), run({ op: 1, delta: -2.5 }), run({ op: 2, label: "z" }));

// Switches in loops: break binds to the switch, continue to the loop; the
// discriminant read constructs no garbage that outlives the statement.
function mk(i: number): Cmd {
  return i % 2 === 0 ? { op: 1, delta: i } : { op: 0, label: "skip" };
}
let total = 0;
for (let i = 0; i < 6; i = i + 1) {
  const c = mk(i);
  switch (c.op) {
    case 0:
      continue;
    case 1:
      total = total + c.delta;
      break;
    case 2:
      total = -999;
  }
  console.log("after switch", i, total);
}
console.log("total", total);

// if/else-if chains over the same discriminant compose with switch.
function judge(s: Shape): string {
  if (s.tag === "circle") {
    return "curved";
  } else if (s.tag === "rect") {
    return `corners ${s.w * s.h}`;
  } else {
    return `straight ${s.len}`;
  }
}
console.log(judge({ tag: "circle", r: 5 }), judge({ tag: "rect", w: 2, h: 2 }), judge({ tag: "line", len: 7 }));
