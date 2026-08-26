// throw/try/catch basics: every primitive value kind thrown and caught,
// nested try, rethrow (a new value thrown from a catch), catch-as-control-flow.
function pick(n: number): string {
  if (n === 0) {
    throw "zero";
  }
  if (n === 1) {
    throw 41.5;
  }
  if (n === 2) {
    throw false;
  }
  return "plain " + n;
}

for (let i = 0; i < 4; i = i + 1) {
  try {
    const s = pick(i);
    console.log("returned:", s);
  } catch {
    console.log("caught at", i);
  }
}

// Nested try: the inner catch takes the inner throw; the outer never fires.
try {
  try {
    throw "inner";
  } catch {
    console.log("inner handler");
  }
  console.log("after inner try");
} catch {
  console.log("outer handler (must not print)");
}

// Rethrow: a catch that throws a NEW value, taken by the enclosing try.
let depth = 0;
try {
  try {
    depth = depth + 1;
    throw "level one";
  } catch {
    depth = depth + 1;
    throw "level two";
  }
} catch {
  depth = depth + 1;
  console.log("rethrown, depth", depth);
}

// A throw that never happens: the catch body must not run.
try {
  console.log("calm path");
} catch {
  console.log("impossible");
}

// Exceptions as control flow out of deep conditionals.
function classify(x: number): string {
  try {
    if (x > 10) {
      if (x > 100) {
        throw "huge";
      }
      throw "big";
    }
    return "small";
  } catch {
    return "thrown for " + x;
  }
}
console.log(classify(5), "/", classify(50), "/", classify(500));
