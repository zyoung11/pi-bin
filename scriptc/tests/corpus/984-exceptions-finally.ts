// finally in the supported subset: runs on normal completion and on
// exception paths (caught, uncaught-then-propagating, and rethrown);
// break/continue/return never cross a finally (rejected at compile time).
let trail: string[] = [];

function work(mode: number): void {
  trail.push("work " + mode);
  if (mode === 1) {
    throw "boom " + mode;
  }
}

// Normal path: finally after the try body.
try {
  work(0);
  trail.push("try done");
} finally {
  trail.push("finally A");
}
console.log(trail.join(" > "));

// Exception path without a catch: the finally runs, then the exception keeps
// propagating to the enclosing handler.
trail = [];
try {
  try {
    work(1);
    trail.push("unreached");
  } finally {
    trail.push("finally B");
  }
  trail.push("also unreached");
} catch {
  trail.push("outer caught");
}
console.log(trail.join(" > "));

// try/catch/finally: the catch takes the exception, the finally still runs.
trail = [];
try {
  work(1);
} catch {
  trail.push("caught here");
} finally {
  trail.push("finally C");
}
trail.push("continues");
console.log(trail.join(" > "));

// A throw INSIDE the catch: the finally runs on the way out, and the new
// exception reaches the outer handler.
trail = [];
try {
  try {
    work(1);
  } catch {
    trail.push("catch rethrows");
    throw "replacement";
  } finally {
    trail.push("finally D");
  }
} catch {
  trail.push("outer took replacement");
}
console.log(trail.join(" > "));

// A throw INSIDE the finally on the exception path REPLACES the in-flight
// exception (the first payload is released).
trail = [];
try {
  try {
    throw "original " + "o".repeat(5);
  } finally {
    trail.push("finally E throws");
    throw "usurper";
  }
} catch {
  trail.push("caught the usurper");
}
console.log(trail.join(" > "));

// Nested finallys unwind inner-to-outer.
trail = [];
try {
  try {
    try {
      throw "deep";
    } finally {
      trail.push("inner finally");
    }
  } finally {
    trail.push("outer finally");
  }
} catch {
  trail.push("landed");
}
console.log(trail.join(" > "));

// finally with refcounted state of its own (scopes inside the finally body).
trail = [];
function guarded(n: number): string {
  let out = "";
  try {
    const s = "payload-" + n;
    if (n > 2) {
      throw s;
    }
    out = s;
  } finally {
    const stamp = "[fin " + n + "]";
    trail.push(stamp);
  }
  return "kept " + out;
}
for (let i = 1; i < 5; i = i + 1) {
  try {
    trail.push(guarded(i));
  } catch {
    trail.push("lost " + i);
  }
}
console.log(trail.join(" > "));
