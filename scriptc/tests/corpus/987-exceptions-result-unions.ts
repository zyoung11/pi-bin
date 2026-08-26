// Result-style unions interoperating with exceptions: a throwing core
// wrapped into a Result API, and a Result consumer that escalates errors
// back into throws — both directions crossing the union machinery.
type Res = { kind: "ok"; value: number } | { kind: "err"; message: string };

function parseDigit(s: string): number {
  // The throwing core: exceptions for the exceptional path.
  if (s.length !== 1) {
    throw "not a single character: '" + s + "'";
  }
  const c = s.charCodeAt(0);
  if (c < 48 || c > 57) {
    throw "not a digit: '" + s + "'";
  }
  return c - 48;
}

function tryParseDigit(s: string): Res {
  // Exceptions → Result: the catch converts failure into an err arm.
  try {
    return { kind: "ok", value: parseDigit(s) };
  } catch {
    return { kind: "err", message: "could not parse '" + s + "'" };
  }
}

function mustParse(s: string): number {
  // Result → exceptions: an err arm escalates back into a throw.
  const r = tryParseDigit(s);
  if (r.kind === "ok") {
    return r.value;
  }
  throw r; // escalate: the (narrowed) err record rides the exception cell
}

for (const probe of ["7", "x", "42", "0"]) {
  const r = tryParseDigit(probe);
  switch (r.kind) {
    case "ok":
      console.log("parsed", r.value);
      break;
    case "err":
      console.log("soft failure:", r.message);
      break;
  }
}

let sum = 0;
try {
  for (const probe of ["1", "2", "3", "oops", "9"]) {
    sum = sum + mustParse(probe);
  }
  console.log("never: full sum");
} catch {
  console.log("hard failure after partial sum", sum);
}
console.log("clean sum:", mustParse("4") + mustParse("5"));

// Results carrying results: a batch API that collects successes and throws
// only when EVERYTHING failed.
function batch(inputs: string[]): number {
  let total = 0;
  let hits = 0;
  for (const s of inputs) {
    const r = tryParseDigit(s);
    if (r.kind === "ok") {
      total = total + r.value;
      hits = hits + 1;
    }
  }
  if (hits === 0) {
    throw "batch had no parsable input (" + inputs.join(";") + ")";
  }
  return total;
}
console.log("batch:", batch(["3", "junk", "4"]));
try {
  console.log("never:", batch(["nope", "!!"]));
} catch {
  console.log("empty batch rejected");
}
