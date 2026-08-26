// node:crypto's string-producing slice. Randomness can't be compared
// value-wise, so every line prints a DERIVED assertion (format, length,
// charset, independence) that holds under Node and the native runtime
// alike; the RangeError path prints Node's message verbatim.
import { randomBytes, randomUUID } from "node:crypto";

function isHex(s: string): boolean {
  for (let i = 0; i < s.length; i = i + 1) {
    const c = s.charAt(i);
    if (!("0123456789abcdef".includes(c))) {
      return false;
    }
  }
  return true;
}

const u = randomUUID();
console.log("len", u.length);
console.log("dashes", u.charAt(8), u.charAt(13), u.charAt(18), u.charAt(23));
console.log("version", u.charAt(14));
console.log("variant", "89ab".includes(u.charAt(19)));
let compact = "";
for (let i = 0; i < u.length; i = i + 1) {
  if (u.charAt(i) !== "-") {
    compact = compact + u.charAt(i);
  }
}
console.log("hex", isHex(compact));
console.log("fresh", randomUUID() !== u);

const h = randomBytes(8).toString("hex");
console.log("hex8", h.length, isHex(h));
console.log("hex0", randomBytes(0).toString("hex") === "");
const b = randomBytes(5).toString("base64");
console.log("b64", b.length, !b.endsWith("="));
console.log("b64pad", randomBytes(4).toString("base64").endsWith("="));
console.log("trunc", randomBytes(1.5).toString("hex").length);
console.log("fresh2", randomBytes(16).toString("hex") !== randomBytes(16).toString("hex"));

try {
  randomBytes(-1).toString("hex");
  console.log("no-throw");
} catch (e) {
  if (e instanceof RangeError) {
    console.log("range", e.message);
  } else {
    console.log("not-a-rangeerror");
  }
}
