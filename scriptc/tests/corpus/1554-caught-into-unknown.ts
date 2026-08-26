// A catch binding flowing into an `unknown` slot (the mdns onError shape):
// the snapshot converts to a dynamic value — Error payloads keep their
// observability (instanceof Error, .message/.name, String()), scalars
// convert exactly, and the canonical handler compiles as written.

type Opts = { onError?: (error: unknown) => void };

function risky(mode: number): string {
  if (mode === 1) throw new Error("boom");
  if (mode === 2) throw new TypeError("bad type");
  if (mode === 3) throw new RangeError("");
  if (mode === 4) throw "plain string";
  if (mode === 5) throw 42;
  if (mode === 6) throw false;
  if (mode === 7) throw { a: 1 };
  return "ok";
}

function run(mode: number, opts: Opts): void {
  try {
    console.log(risky(mode));
  } catch (error) {
    opts.onError?.(error);
  }
}

const opts: Opts = {
  onError: (error) => {
    // The canonical narrowing handler — the portless LAN-monitor shape.
    const message = error instanceof Error ? error.message : String(error);
    console.log(`handled: <${message}>`);
    if (error instanceof Error) {
      console.log(`name=${error.name} str=${String(error)}`);
    } else if (typeof error === "string") {
      console.log(`string len=${error.length}`);
    } else if (typeof error === "number") {
      console.log(`number ${error + 1}`);
    } else if (typeof error === "boolean") {
      console.log(`boolean ${error ? "t" : "f"}`);
    } else {
      console.log(error ? "truthy other" : "falsy other");
    }
  },
};
for (const m of [0, 1, 2, 3, 4, 5, 6, 7]) run(m, opts);
run(1, {}); // absent handler: the optional call short-circuits

// A user Error subclass keeps name/message/Error-ness through the boundary.
class CustomError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "CustomError";
  }
}
function runCustom(opts: Opts): void {
  try {
    throw new CustomError("custom failure");
  } catch (e) {
    opts.onError?.(e);
  }
}
runCustom(opts);

// The converted value stores like any unknown; extraction narrows again.
function capture(): unknown {
  try {
    throw new Error("stored");
  } catch (e) {
    const u: unknown = e;
    return u;
  }
}
const first = capture();
console.log(first instanceof Error ? first.message : "not an error");
console.log("done");
