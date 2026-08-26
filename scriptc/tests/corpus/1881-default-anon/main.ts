// Anonymous default exports: the declaration has no name, but the checker
// still has its symbol (the module's default export), so imports resolve
// like any named binding.
import add from "./adder.ts";
import AnonBox from "./box.ts";

console.log(add(20, 22));
console.log(new AnonBox().tag());
