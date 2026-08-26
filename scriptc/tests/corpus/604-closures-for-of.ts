// The classic for for-of: each iteration's const binding is its own value,
// so closures made in iteration k keep seeing iteration k's element.
function capturePerElement(): number {
  let f0 = () => -1;
  let f1 = () => -1;
  let f2 = () => -1;
  let k = 0;
  for (const x of [10, 20, 30]) {
    const grab = () => x;
    if (k === 0) {
      f0 = grab;
    } else if (k === 1) {
      f1 = grab;
    } else {
      f2 = grab;
    }
    k++;
  }
  return f0() * 10000 + f1() * 100 + f2();
}
console.log(capturePerElement());

// Ref elements: the captured binding keeps the string alive after the loop
// (and after the source array is gone).
function captureStrings(): string {
  let first = () => "";
  let last = () => "";
  const words = ["alpha", "beta", "gamma"];
  let k = 0;
  for (const w of words) {
    const grab = () => w + "!";
    if (k === 0) {
      first = grab;
    }
    last = grab;
    k++;
  }
  words.pop();
  words.pop();
  words.pop();
  return first() + " " + last();
}
console.log(captureStrings());

// break/continue release the iteration's binding on the way out; captures
// made before the jump stay valid.
function captureAroundJumps(): string {
  let out = "";
  let keep = () => "none";
  for (const s of ["skip", "take", "skip", "stop", "never"]) {
    const fmt = () => `<${s}>`;
    if (s === "skip") {
      continue;
    }
    if (s === "stop") {
      break;
    }
    keep = fmt;
    out = out + fmt();
  }
  return out + " kept:" + keep();
}
console.log(captureAroundJumps());

// A closure can mutate its own iteration's binding (for-of with let); the
// next iteration still gets the next element, untouched.
function mutateOwnBinding(): string {
  let out = "";
  for (let n of [1, 2, 3]) {
    const double = () => {
      n = n * 2;
    };
    double();
    double();
    out = out + n + ",";
  }
  return out;
}
console.log(mutateOwnBinding());

// RC stress: many short-lived captures of ref elements; only one survives.
function churn(): string {
  let survivor = () => "none";
  for (let round = 0; round < 50; round++) {
    for (const piece of [`r${round}a`, `r${round}b`, `r${round}c`]) {
      const grab = () => piece + "*";
      if (round === 49 && piece === "r49b") {
        survivor = grab;
      }
    }
  }
  return survivor();
}
console.log(churn());
