// Error subclasses: user classes extending the runtime-provided hierarchy.
// Layout, constructor chaining (super(msg)), name defaulting ("Error"
// unless assigned — Node-exact: the class name is NOT the name property),
// added fields/methods, instanceof narrowing, upcasts through base-typed
// slots.
class AppError extends Error {
  code: number;
  constructor(msg: string, code: number) {
    super(msg);
    this.name = "AppError";
    this.code = code;
  }
  render(): string {
    return `${this.name}(${this.code}): ${this.message}`;
  }
}

class QuietError extends Error {}

const app = new AppError("db down", 503);
console.log(app.name, app.message, app.code, app.render(), app.toString());

const quiet = new QuietError("shh");
console.log(quiet.name, quiet.message, quiet.toString());
const quiet2 = new QuietError();
console.log(quiet2.toString());

// Subclass of a builtin subclass.
class ParseFail extends SyntaxError {
  line = 0;
}
const pf = new ParseFail("unexpected token");
console.log(pf.name, pf.line, pf instanceof SyntaxError, pf instanceof Error, pf instanceof TypeError);

// instanceof narrows through base-typed slots (trust-the-checker downcast).
function inspect(e: Error): string {
  if (e instanceof AppError) {
    return `app ${e.code}`;
  }
  if (e instanceof ParseFail) {
    return `parse at ${e.line}`;
  }
  return e.toString();
}
console.log(inspect(app), inspect(pf), inspect(quiet));

// Errors thrown and caught as control flow (bindingless catch).
function boom(kind: number): string {
  if (kind === 0) throw new AppError("zero", 0);
  if (kind === 1) throw new QuietError("one");
  return "no throw";
}
for (let k = 0; k < 3; k = k + 1) {
  try {
    console.log(boom(k));
  } catch {
    console.log("caught", k);
  }
}
