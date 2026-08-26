// break/continue/return inside PLAIN try/catch (no finally): the jumps
// unwind normally — releasing the try scopes like any other block — and the
// pending-exception machinery is untouched by them.
function risky(i: number): string {
  if (i % 4 === 2) {
    throw "spike " + i;
  }
  return "v" + i;
}

function scan(limit: number): string {
  let acc = "";
  for (let i = 0; i < limit; i = i + 1) {
    const label = "[" + i + "]";
    try {
      const v = risky(i);
      if (i === 3) {
        acc = acc + label + "skip;";
        continue;
      }
      if (i === 5) {
        acc = acc + label + "stop;";
        break;
      }
      if (i === 7) {
        return acc + label + "returned(" + v + ")";
      }
      acc = acc + label + v + ";";
    } catch {
      acc = acc + label + "caught;";
    }
  }
  return acc + "end";
}
console.log(scan(4));
console.log(scan(6));
console.log(scan(12));

// break out of a switch from inside a try, and continue from a catch body.
let notes: string[] = [];
for (let round = 0; round < 4; round = round + 1) {
  switch (round % 2) {
    case 0:
      try {
        if (round === 2) {
          throw "even trouble";
        }
        notes.push("even " + round);
        break;
      } catch {
        notes.push("even caught " + round);
      }
      notes.push("after even try " + round);
      break;
    default:
      try {
        throw "odd " + round;
      } catch {
        notes.push("odd caught " + round);
        continue;
      }
  }
  notes.push("bottom " + round);
}
console.log(notes.join(" / "));

// A while loop that only ends via break inside try; catch rearms it.
let fuel = 3;
while (true) {
  try {
    fuel = fuel - 1;
    if (fuel < 0) {
      break;
    }
    throw "burn " + fuel;
  } catch {
    console.log("cycle, fuel", fuel);
  }
}
console.log("engine off");
