// Labeled statements: labeled break/continue on every loop shape, labeled
// switch break, labeled blocks, multi-label chains, and unlabeled jumps
// inside labeled constructs binding to their own innermost targets.

// Labeled break out of a nested for from the outer while.
let hits = 0;
outer: while (true) {
  for (let i = 0; i < 10; i = i + 1) {
    hits = hits + 1;
    if (i === 3) {
      break outer;
    }
  }
}
console.log("break outer from for:", hits);

// Labeled continue of the OUTER loop: skips the rest of the outer body.
let picked = "";
rows: for (let r = 0; r < 4; r = r + 1) {
  for (let c = 0; c < 4; c = c + 1) {
    if (c > r) {
      continue rows;
    }
    picked = picked + r + "" + c + " ";
  }
  picked = picked + "| ";
}
console.log("continue rows:", picked);

// A label chain: both names target the same loop.
let chain = 0;
target1: target2: while (true) {
  chain = chain + 1;
  if (chain === 2) {
    break target1;
  }
}
console.log("chain via target1:", chain);
target3: target4: while (true) {
  chain = chain + 1;
  break target4;
}
console.log("chain via target4:", chain);

// Labeled continue on a labeled while from inside a switch: the switch is
// crossed (Node runs the loop again), and labeled break exits the loop.
let mode = 0;
let trace = "";
pump: while (true) {
  switch (mode) {
    case 0:
      mode = 1;
      trace = trace + "a";
      continue pump;
    case 1:
      mode = 2;
      trace = trace + "b";
      continue pump;
    default:
      trace = trace + "c";
      break pump;
  }
}
console.log("switch pump:", trace, mode);

// Labeled SWITCH: `break lbl` names the switch itself.
const flavor = "kiwi";
let said = "";
pick: switch (flavor) {
  case "kiwi":
    said = said + "green ";
    if (said.length > 3) {
      break pick;
    }
    said = said + "unreached ";
    break;
  default:
    said = said + "plain ";
}
console.log("labeled switch:", said);

// Labeled BLOCK: break exits the block, skipping its tail.
let acc = "";
blk: {
  acc = acc + "in ";
  if (acc === "in ") {
    break blk;
  }
  acc = acc + "never ";
}
console.log("labeled block:", acc);

// Labeled if via break (a labeled non-loop statement).
let ifTrace = "start";
guard: if (ifTrace === "start") {
  ifTrace = ifTrace + " body";
  break guard;
  // eslint-disable-next-line no-unreachable
  ifTrace = ifTrace + " never";
}
console.log("labeled if:", ifTrace);

// Labeled do-while: continue re-evaluates the condition, break exits.
let dw = 0;
let dwTrace = "";
duo: do {
  dw = dw + 1;
  if (dw === 2) {
    continue duo;
  }
  dwTrace = dwTrace + dw + " ";
  if (dw >= 4) {
    break duo;
  }
} while (dw < 10);
console.log("do-while:", dwTrace, dw);

// Labeled for-of over an array (strings — refcounted elements survive the
// labeled jumps), from a nested loop.
const words = ["alpha", "beta", "gamma", "delta"];
let joined = "";
scan: for (const w of words) {
  for (let k = 0; k < w.length; k = k + 1) {
    if (w === "gamma") {
      break scan;
    }
    if (k > 1) {
      continue scan;
    }
    joined = joined + w.charAt(k);
  }
}
console.log("for-of scan:", joined);

// Labeled for-of over a STRING (code-point walk), labeled continue.
let vowels = "";
chars: for (const ch of "programmatic") {
  if (ch !== "a" && ch !== "o") {
    continue chars;
  }
  vowels = vowels + ch;
}
console.log("string chars:", vowels);

// Unlabeled break/continue inside labeled loops bind to the INNERMOST
// loop, not the labeled one.
let inner = "";
shell: for (let i = 0; i < 3; i = i + 1) {
  for (let j = 0; j < 5; j = j + 1) {
    if (j === 1) {
      continue;
    }
    if (j === 3) {
      break;
    }
    inner = inner + i + "" + j + " ";
  }
  if (i === 2) {
    break shell;
  }
}
console.log("unlabeled inside labeled:", inner);

// Labels are per-function: the same name is fine in a nested function.
function nested(): number {
  let n = 0;
  outer: while (true) {
    n = n + 1;
    if (n > 2) {
      break outer;
    }
  }
  return n;
}
console.log("nested fn label:", nested());

// A label nothing jumps to (still must run its statement), including on a
// plain expression statement.
tag: console.log("plain labeled statement");
free: for (let z = 0; z < 2; z = z + 1) {
  console.log("unused label pass", z);
}
