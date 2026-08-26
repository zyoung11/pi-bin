// Typed catch bindings: catch (e) binds the thrown value; supported uses
// are the narrowing tests (instanceof for hierarchy classes, typeof for
// primitives), reads under a narrow, and rethrow. Every branch is
// Node-exact.
class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`status ${status}`);
    this.name = "HttpError";
    this.status = status;
  }
}

function pick(n: number): string {
  if (n === 0) throw new HttpError(404);
  if (n === 1) throw new TypeError("boom");
  if (n === 2) throw "plain string";
  if (n === 3) throw 42;
  throw true;
}

function classify(n: number): string {
  try {
    pick(n);
  } catch (e) {
    if (e instanceof HttpError) {
      return `http ${e.status} ${e.message}`;
    }
    if (e instanceof Error) {
      return `error ${e.name}: ${e.message}`;
    }
    if (typeof e === "string") {
      return `string ${e.length} ${e}`;
    }
    if (typeof e === "number") {
      return `number ${e + 1}`;
    }
    if (typeof e === "boolean") {
      return `boolean ${e ? "t" : "f"}`;
    }
    return "unreachable";
  }
  return "no throw";
}
for (let n = 0; n < 5; n = n + 1) {
  console.log(classify(n));
}

// Rethrow: `throw e` preserves the value exactly through another hop.
function rethrows(n: number): string {
  try {
    pick(n);
  } catch (e) {
    throw e;
  }
  return "no";
}
try {
  rethrows(1);
} catch (e) {
  if (e instanceof TypeError) console.log("rethrown", e.message);
}
try {
  rethrows(3);
} catch (e) {
  if (typeof e === "number") console.log("rethrown", e * 2);
}

// Narrowed bindings assign into typed locals (the capture escape hatch).
try {
  pick(0);
} catch (e) {
  if (e instanceof HttpError) {
    const kept: HttpError = e;
    console.log("kept", kept.status, kept instanceof Error);
  }
}

// The binding scopes per catch; nested try/catch bind independently.
try {
  pick(1);
} catch (outer) {
  try {
    pick(2);
  } catch (inner) {
    const a = outer instanceof Error ? outer.name : "?";
    const b = typeof inner === "string" ? inner : "?";
    console.log("nested", a, b);
  }
}

// typeof negation narrows the else branch.
try {
  pick(2);
} catch (e) {
  if (typeof e !== "string") {
    console.log("unreachable");
  } else {
    console.log("negated", e);
  }
}
