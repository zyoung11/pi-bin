// Unary + over strings IS ToNumber — the same StringToNumber lowering
// Number(aString) takes — and util.format %d rides it too: strings
// convert before formatting. Also the classic +x idioms: sort
// comparators over numeric strings and quick input coercion.
console.log(+"42", +"-3.5", +" 7 ", +"", +"  ", +"0x1f", +"1e3");
console.log(+"Infinity", +"-Infinity", +"12px", +"0b101", +"-0x1");
console.log(1 / +"-0", 1 / +"", +"." , +".5"); // 1/x tells -0 from +0

// Parenthesized and nested forms; the result is an ordinary double.
const raw = "19.75";
console.log(+raw + 0.25, -+raw, +raw * 2, +raw === 19.75);

// The sort-by-numeric-value idiom over string data.
const ids = ["10", "2", "33", "4"];
ids.sort((a, b) => +a - +b);
console.log(ids.join(","));

// util.format %d: numbers as-is, booleans 1/0, and now strings through
// ToNumber (console.log's format path is util.format).
console.log("port %d retries %d", "8080", "3");
console.log("bad %d empty %d spaced %d", "12px", "", " 42 ");
console.log("hex %d inf %d neg %d", "0xff", "Infinity", "-2.5");

// Chained coercion in conditions and template strings.
const flag = "0";
console.log(+flag === 0 ? "off" : "on", `${+"3" + +"4"}`);
