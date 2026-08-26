// util.inspect over scalars: Node's exact number formatting (-0, the
// exponent forms, NaN/Infinity), the string quoting ladder (single →
// double → backtick), C0/DEL escapes, the 10000-char cap with its
// "... N more characters" trailer, and the per-line ` +` continuation
// split for long multi-line strings. Node is the oracle byte-for-byte.
import { inspect } from "node:util";

// numbers — inspect renders -0 as '-0' where String() answers '0'
console.log(inspect(0));
console.log(inspect(-0));
console.log(inspect(1));
console.log(inspect(-1.5));
console.log(inspect(123456789));
console.log(inspect(1e21));
console.log(inspect(-1e21));
console.log(inspect(1e-7));
console.log(inspect(5e-324));
console.log(inspect(1.7976931348623157e308));
const nan = 0 / 0;
console.log(inspect(nan));
console.log(inspect(1 / 0));
console.log(inspect(-1 / 0));
console.log(inspect(0.30000000000000004));
console.log(inspect(2 ** 53));

// booleans and units
console.log(inspect(true));
console.log(inspect(false));
console.log(inspect(null));
console.log(inspect(undefined));

// the quoting ladder
console.log(inspect(""));
console.log(inspect("plain"));
console.log(inspect("it's"));
console.log(inspect('say "hi"'));
console.log(inspect(`it's "quoted"`));
console.log(inspect("has ` tick and ' and \""));
console.log(inspect("dollar ${x} with ' and \""));

// escapes: C0 controls, DEL, backslash — and the escapes table's named forms
console.log(inspect("tab\there"));
console.log(inspect("nl\nshort"));
console.log(inspect("cr\rhere"));
console.log(inspect("\b\f\v"));
console.log(inspect("\x00\x01\x1f"));
console.log(inspect("\x7f"));
console.log(inspect("back\\slash"));
console.log(inspect("unicode ✓ 日本語 😀"));

// long strings: no newline = no split; with newlines the ` +` form
console.log(inspect("x".repeat(200)));
console.log(inspect("x".repeat(75) + "\ny"));
console.log(inspect("line one padding padding padding\nline two padding padding padding padding\nline three"));

// the 10000-char cap
console.log(inspect("z".repeat(10000)));
console.log(inspect("z".repeat(10001)));
console.log(inspect("z".repeat(10002)));
