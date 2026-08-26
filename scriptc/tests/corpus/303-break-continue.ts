// break/continue in while and for, nested loops, with strings in scope so
// the sanitized lane proves the jump paths release correctly.
let i = 0;
while (true) {
  i = i + 1;
  if (i === 3) {
    continue;
  }
  if (i > 5) {
    break;
  }
  console.log("while", i);
}

for (let j = 0; j < 10; j = j + 1) {
  const tag = `j=${j}`;
  if (j % 2 === 0) {
    continue;
  }
  if (j > 6) {
    break;
  }
  console.log(tag);
}

// nested: break/continue bind to the innermost loop
for (let a = 0; a < 3; a = a + 1) {
  let out = `row ${a}:`;
  for (let b = 0; b < 5; b = b + 1) {
    if (b === a) {
      continue;
    }
    if (b === 4) {
      break;
    }
    out = out + ` ${b}`;
  }
  console.log(out);
}

// while(true) as a function's only exit
function firstMultiple(of: number, above: number): number {
  let candidate = of;
  while (true) {
    if (candidate > above) {
      return candidate;
    }
    candidate = candidate + of;
  }
}
console.log(firstMultiple(7, 100));
