// Calls through the hybrid: the base (`colors.blue(...)`), the property
// (`colors.blue.bold(...)`), through aliases and extracted values, and
// extraction into a plain function slot. Object.keys answers the assigned
// enumerable keys, like Node.
import colors from "./colors.ts";
const chalk = colors;
console.log(colors.blue("plain-blue"));
console.log(colors.blue.bold("blue-bold"));
console.log(chalk.cyan("cyan-base"), chalk.cyan.bold("cyan-bold"));
console.log(colors.red("warn"), colors.gray("quiet"), colors.green("ok"));
const b = colors.blue;
console.log(b("through-value"), b.bold("value-bold"));
const f: (s: string) => string = colors.blue;
console.log(f("extracted"));
console.log(Object.keys(colors.blue).join(","));
