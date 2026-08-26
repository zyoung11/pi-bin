// Error objects: construction, fields, toString — Node-exact by
// construction (the runtime implements ECMA Error.prototype.toString over
// the name/message fields; new Error() defaults message to "").
const plain = new Error("boom");
console.log(plain.message, plain.name, plain.toString());

const empty = new Error();
console.log(empty.message === "", empty.name, empty.toString());

const te = new TypeError("wrong type");
const re = new RangeError("out of range");
const se = new SyntaxError("bad syntax");
console.log(te.name, re.name, se.name);
console.log(te.toString(), re.toString(), se.toString());

// name and message are plain writable fields, like Node.
const named = new Error("msg");
named.name = "Custom";
console.log(named.toString());
named.name = "";
console.log(named.toString() === "msg");
named.message = "";
console.log(named.toString() === "");

// instanceof across the builtin hierarchy.
console.log(te instanceof TypeError, te instanceof Error, te instanceof RangeError);
console.log(plain instanceof Error, plain instanceof TypeError);

// Errors are ordinary values: params, returns, arrays of messages.
function describe(e: Error): string {
  return e.toString();
}
console.log(describe(te), describe(plain));
