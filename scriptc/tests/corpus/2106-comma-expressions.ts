// Comma expressions: statement position runs both operands for effect in
// source order; VALUE position runs the left as its statement lowering
// under a seqExpr and yields the RIGHT operand's value (JS's GetValue of
// the right reference). Chains associate left, for-incrementors ride the
// statement form, and destructuring assignments pair on either side —
// the conformance corpus's `({} = a, [] = a)` idiom.
let log: string[] = [];
function eff(n: string): number { log.push(n); return n.length; }
// Chained comma in value position: left-to-right, value = last operand.
let v = (eff("a"), eff("bb"), eff("ccc"));
console.log(v, JSON.stringify(log));
// Statement position: both values discarded, effects ordered.
eff("x"), eff("yy");
console.log(JSON.stringify(log));
// For-incrementor comma.
let s = "";
let j = 10;
for (let i = 0; i < 3; i++, j--) s += `${i}:${j} `;
console.log(s);
// Destructuring assignment on both sides of the comma.
let a = { x: 1, y: 2 };
let b = [5, 6];
let x = 0, y = 0, p = 0, q = 0;
let r = ({ x, y } = a, [p, q] = b);
console.log(x, y, p, q, JSON.stringify(r));
// Empty patterns around a comma: each side evaluates its source once.
let u = ({} = a, [] = b);
console.log(JSON.stringify(u));
// Value threading: the comma's value is the RIGHT assignment's value.
let w = (x = 100, y = 200);
console.log(w, x, y);
// Comma as a call argument.
console.log((eff("z"), "arg"));
console.log(JSON.stringify(log));
// Comma in an arrow body's parenthesized expression.
const f = () => (eff("f"), 7);
console.log(f(), JSON.stringify(log));
