// Deliberately allocation-heavy throw paths: strings, arrays, records, and
// closures alive (owned by locals, temps, and containers) at the moment of
// the throw. The sanitized lane is the point — unwinding must release every
// frame temp and every scope local it bypasses.
interface Node2 {
  tag: string;
  weight: number;
}

function build(i: number): Node2 {
  return { tag: "node-" + i + "-" + "x".repeat(i + 1), weight: i * 1.5 };
}

function churn(rounds: number): string {
  let last = "";
  for (let i = 0; i < rounds; i = i + 1) {
    const pad = "=".repeat(i + 2);
    const held: string[] = [pad, pad + pad, "round " + i];
    const rec = build(i);
    const closure = (s: string): string => s + "/" + rec.tag + "/" + held.length;
    last = closure(pad);
    if (i === rounds - 1) {
      // Everything above — held, rec, closure, last, plus the temps of this
      // very expression — is live right here.
      throw "churn stopped at " + i + " with " + last;
    }
  }
  return last;
}

for (const rounds of [1, 3, 6]) {
  try {
    console.log(churn(rounds));
  } catch {
    console.log("released", rounds, "rounds");
  }
}

// Throw from inside nested scopes: block scopes, a switch, and a for-of all
// entered — each holding refcounted locals — when the exception leaves.
function deep(sel: string): string {
  const outer = ["alpha", "beta", "gamma"];
  {
    const inner = outer.join("+");
    for (const word of outer) {
      const decorated = "<" + word + ">";
      switch (word) {
        case sel: {
          const boom = decorated + " matched in " + inner;
          throw boom;
        }
        default:
          break;
      }
    }
  }
  return "no match for " + sel;
}

for (const probe of ["beta", "delta", "alpha"]) {
  try {
    console.log(deep(probe));
  } catch {
    console.log("unwound out of", probe);
  }
}

// Exception payloads replaced in flight: each rethrow releases the previous
// payload (all of them heap strings built at throw time).
function relay(n: number): string {
  try {
    throw "first-" + "a".repeat(n);
  } catch {
    try {
      throw "second-" + "b".repeat(n);
    } catch {
      return "settled " + n;
    }
  }
}
console.log(relay(4), relay(9));
