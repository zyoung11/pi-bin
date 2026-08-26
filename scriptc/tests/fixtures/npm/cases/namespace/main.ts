// @dynamic
// Namespace import of a CJS package: the interop namespace (default =
// module.exports, plus its properties) — method calls ride getProp/call.
import * as adder from "adder";

const sum: number = adder.add(2, 3);
console.log(sum);
const answer: number = adder.ANSWER;
console.log(answer);
