// String(e) and `${e}` on a catch binding: JS's String() over the thrown
// value — numbers/booleans/strings by value, Error payloads by
// Error.prototype.toString ("name: message"; String(e) carries no stack in
// Node either), records and toString-less class instances as
// "[object Object]". Every line here is Node-exact (thrown arrays and
// closures are the documented approximation — see SEMANTICS.md).
class QuotaError extends Error {
  constructor(limit: number) {
    super(`over ${limit}`);
    this.name = "QuotaError";
  }
}
class Plain extends Error {
  constructor() {
    super(); // no message: toString drops the colon
  }
}
class Carrier {
  tag: string;
  constructor(tag: string) {
    this.tag = tag;
  }
}
class Sub extends Carrier {}

function pick(n: number): never {
  if (n === 0) throw new Error("boom");
  if (n === 1) throw new QuotaError(9);
  if (n === 2) throw new Plain();
  if (n === 3) throw "just text";
  if (n === 4) throw 42.5;
  if (n === 5) throw false;
  if (n === 6) throw { code: 7 };
  throw new Sub("t");
}

for (let n = 0; n < 8; n = n + 1) {
  try {
    pick(n);
  } catch (e) {
    console.log(String(e));
    console.log(`wrapped: <${e}>!`);
  }
}

// The real-CLI entry-point pattern verbatim: the canonical narrow-or-convert
// ternary reads the message off Errors and String()s everything else.
function describe(n: number): string {
  try {
    pick(n);
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
  return "no throw";
}
for (let n = 0; n < 7; n = n + 1) {
  console.log(describe(n));
}

// The .catch-handler parameter is a catch binding too (the desugar's
// try/catch binds it): String(e) works there unchanged.
async function rejects(): Promise<void> {
  throw new QuotaError(3);
}
rejects().catch((e) => {
  console.log(`handler saw ${e}`);
});
