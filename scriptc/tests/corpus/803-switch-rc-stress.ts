// RC discipline through switch: string/array values on every path — the
// discriminant temp across bodies, case-body locals skipped by dispatch,
// jump paths (break/continue/return) releasing partially-entered scopes,
// and re-entry of a switch inside a loop (stale-local hazard).

// String discriminant stays alive across tests and bodies; break releases it.
function classify(s: string): string {
  switch (s + "!") {
    case "hi!":
      return `greeting ${s}`;
    case "bye!":
      let farewell = `farewell ${s}`;
      return farewell;
    default:
      return "other";
  }
}
console.log(classify("hi"), classify("bye"), classify("hm"));

// A loop re-enters the switch and each iteration lands in a DIFFERENT case:
// locals declared in the skipped cases must not double-release.
for (let i = 0; i < 6; i = i + 1) {
  switch (i % 3) {
    case 0:
      let a = `alpha ${i}`;
      console.log(a);
      break;
    case 1:
      let bs: string[] = [`beta ${i}`, "tail"];
      console.log(bs[0], bs.length);
      break;
    default:
      let c = "gamma";
      c = c + ` ${i}`;
      console.log(c);
  }
}

// Fall-through carries a string local into later cases; a later case
// reassigns it (releasing the old value).
const path: string = "start";
switch (path) {
  case "start":
    let acc = `${path}-1`;
    acc = acc + "-grew";
    console.log(acc);
  case "middle":
    acc = "assigned in middle";
    console.log(acc);
  case "end":
    acc = "replaced";
    console.log(acc);
    break;
  case "unreached":
    console.log("no");
}

// continue out of a switch releases case-scope strings AND loop-scope strings
let kept = 0;
for (let i = 0; i < 5; i = i + 1) {
  const label: string = `item ${i}`;
  switch (i % 2) {
    case 1:
      let doomed = label + " (odd, skipped)";
      console.log(doomed);
      continue;
  }
  console.log("kept", label);
  kept = kept + 1;
}
console.log("kept total", kept);

// arrays flowing through cases; discriminant chosen by array content
const data: number[] = [3, 1, 2];
switch (data[0]) {
  case 3:
    let picked = [data[1], data[2]];
    picked.push(99);
    console.log("picked", picked.length, picked[2]);
    break;
  default:
    console.log("no");
}

// return from deep inside a switch inside a loop, with strings in scope
function find(haystack: string[], needle: string): number {
  for (let i = 0; i < haystack.length; i = i + 1) {
    const cur = `<${haystack[i]}>`;
    switch (haystack[i]) {
      case needle:
        let hit = `found ${cur}`;
        console.log(hit);
        return i;
      case "stop":
        return -2;
    }
  }
  return -1;
}
console.log(find(["a", "b", "c"], "b"), find(["a"], "z"));
console.log("done");
