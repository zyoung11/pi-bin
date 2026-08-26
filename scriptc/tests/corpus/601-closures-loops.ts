// The classic: for(let) creates a fresh binding per iteration.
function capturePerIteration(): number {
  let f0 = () => -1;
  let f1 = () => -1;
  let f2 = () => -1;
  for (let i = 0; i < 3; i++) {
    const grab = () => i * 100 + 7;
    if (i === 0) {
      f0 = grab;
    } else if (i === 1) {
      f1 = grab;
    } else {
      f2 = grab;
    }
  }
  return f0() + f1() + f2();
}
console.log(capturePerIteration());

// while-loop block scoping: each iteration's const is its own binding
function captureFromWhile(): string {
  let early = () => "";
  let late = () => "";
  let k = 0;
  while (k < 4) {
    const snapshot = `k=${k}`;
    const grab = () => snapshot;
    if (k === 0) {
      early = grab;
    }
    if (k === 3) {
      late = grab;
    }
    k++;
  }
  return early() + " " + late();
}
console.log(captureFromWhile());

// mutation of the loop variable through a closure between iterations
function skipper(): number {
  let calls = 0;
  for (let i = 0; i < 10; i = i + 1) {
    const bump = () => {
      i = i + 2; // the closure mutates THIS iteration's binding; the copy
    };
    bump(); //      feeds the next iteration, so the loop strides by 3
    calls = calls + 1;
  }
  return calls;
}
console.log(skipper());

// closures + break/continue interplay with capture boxes
function collect(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    const fmt = () => `<${i}>`;
    if (i % 2 === 0) {
      continue;
    }
    if (i > 4) {
      break;
    }
    out = out + fmt();
  }
  return out;
}
console.log(collect());
