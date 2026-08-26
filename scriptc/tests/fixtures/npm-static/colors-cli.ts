// npm-static pilot: the real picocolors package (vendored) compiled
// STATICALLY. Non-TTY stdout answers isColorSupported=false both under
// Node and compiled (the differential pipes stdout), so the plain-text
// passthrough branch is the driven path — byte-compared with Node.
import pc from "picocolors";

console.log(pc.green("ok"));
console.log(pc.red("fail"));
console.log(pc.bold(pc.blue("deep")));
console.log(pc.dim("quiet"));
console.log(pc.italic("lean"));
console.log(pc.underline("line"));
console.log(pc.inverse("swap"));
console.log(pc.yellow(`${2 + 3} widgets`));
console.log(pc.bgGreen("field"));
console.log(pc.cyanBright("bright"));
console.log(String(pc.isColorSupported));
