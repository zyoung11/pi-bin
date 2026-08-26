import { exclaim, greet } from "greeter";

console.log(greet("world"));
console.log(greet("compiler", { loud: true }));
console.log(exclaim(greet("chain")));
