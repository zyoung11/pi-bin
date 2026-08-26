// @dynamic
// Named imports from a CJS-only package: exports come off module.exports,
// values exit at the typed boundaries the .d.ts declares.
import { add, ANSWER } from "adder";

const total: number = add(20, 22);
console.log(total);
const answer: number = ANSWER;
console.log(answer);
console.log(add(0.1, 0.2) as number);
