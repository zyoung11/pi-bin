// break/continue binding around switch: break inside a switch exits the
// SWITCH (not the loop); continue inside a switch targets the enclosing LOOP.
for (let i = 0; i < 5; i = i + 1) {
  switch (i) {
    case 1:
      console.log("one, breaking switch");
      break;
    case 2:
      console.log("two, continuing loop");
      continue;
    case 3:
      console.log("three, falling through");
    case 4:
      console.log("three-or-four");
      break;
  }
  console.log("after switch", i);
}

// continue from a switch inside a while loop (no update expression)
let w = 0;
while (w < 4) {
  w = w + 1;
  switch (w % 2) {
    case 0:
      continue;
  }
  console.log("odd", w);
}

// continue from a switch inside for-of
const words: string[] = ["keep", "skip", "keep", "skip"];
for (const word of words) {
  switch (word) {
    case "skip":
      continue;
  }
  console.log("kept", word);
}

// loops inside switch cases: their own break/continue bind to the loop
const mode: number = 1;
switch (mode) {
  case 1:
    for (let j = 0; j < 5; j = j + 1) {
      if (j === 3) {
        break; // exits the for, not the switch
      }
      if (j === 1) {
        continue;
      }
      console.log("inner for", j);
    }
    console.log("still in case 1");
    break;
  default:
    console.log("no");
}

// nested switches: inner break exits the inner switch only
const outer: number = 1;
const inner: string = "x";
switch (outer) {
  case 1:
    switch (inner) {
      case "x":
        console.log("inner x");
        break;
      case "y":
        console.log("inner y");
    }
    console.log("outer 1 continues");
    break;
  case 2:
    console.log("outer 2");
}

// do-while wrapping a switch that continues (condition still evaluates)
let d = 0;
do {
  d = d + 1;
  switch (d) {
    case 2:
      continue;
  }
  console.log("dw", d);
} while (d < 4);
console.log("done");
