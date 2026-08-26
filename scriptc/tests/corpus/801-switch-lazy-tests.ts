// Case tests are lazily evaluated IN SOURCE ORDER: the discriminant runs
// exactly once, tests run until one matches, and everything after the match
// (including default's position) never evaluates.
function probe(label: string, value: number): number {
  console.log("test", label);
  return value;
}
function strProbe(label: string, value: string): string {
  console.log("test", label);
  return value;
}
function disc(value: number): number {
  console.log("disc", value);
  return value;
}

// match at the second test: first and second evaluate, third and fourth don't
switch (disc(2)) {
  case probe("a", 1):
    console.log("body a");
    break;
  case probe("b", 2):
    console.log("body b");
    break;
  case probe("c", 3):
    console.log("body c");
    break;
  case probe("d", 4):
    console.log("body d");
}

// no match: every test evaluates once, then default runs
switch (disc(99)) {
  case probe("e", 1):
    console.log("body e");
    break;
  default:
    console.log("body default");
    break;
  case probe("f", 2):
    console.log("body f");
}

// default in the middle is SKIPPED by the test scan (tests keep evaluating
// in source order past it) but entered via fall-through from the match.
switch (disc(5)) {
  case probe("g", 4):
    console.log("body g");
  default:
    console.log("body default-mid");
  case probe("h", 5):
    console.log("body h");
  case probe("i", 6):
    console.log("body i (fell through)");
}

// string tests: lazy too, compared by content
const needle: string = "beta";
switch (needle) {
  case strProbe("s1", "alpha"):
    console.log("alpha");
    break;
  case strProbe("s2", "beta"):
    console.log("beta");
    break;
  case strProbe("s3", "gamma"):
    console.log("gamma");
    break;
}

// tests with visible side effects on shared state (an arrow, so it can
// capture the top-level binding)
let calls: number = 0;
const counting = (ret: number): number => {
  calls = calls + 1;
  return ret;
};
const target: number = 30;
switch (target) {
  case counting(10):
  case counting(20):
  case counting(30):
  case counting(40):
    console.log("matched after", calls, "test evaluations");
    break;
}
console.log("final calls", calls);
