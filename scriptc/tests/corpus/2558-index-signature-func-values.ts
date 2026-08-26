// FUNCTION-valued index signatures: the command-registry pattern. The
// overflow store holds closures with the usual RC/trace machinery; reads
// dispatch through declared fields and the overflow alike, and
// undefined-armed union slots cover the miss cases.

type Command = (arg: string) => string;
const commands: Record<string, Command> = {
  greet: (arg) => `hello ${arg}`,
};
commands["shout"] = (arg) => arg.toUpperCase();
console.log(commands["greet"]("world"));
console.log(commands["shout"]("loud"));
const dyn = "gr" + "eet";
console.log(commands[dyn]("dyn"));

// Enumeration and calls through Object.keys/entries.
console.log(Object.keys(commands).join(","));
for (const [name, fn] of Object.entries(commands)) {
  console.log(name, fn(name));
}

// delete removes an overflow entry (and releases the closure).
delete commands["shout"];
console.log(Object.keys(commands).join(","));

// Miss-tolerant lookups through an undefined-armed union slot.
const maybe: Record<string, (() => number) | undefined> = { one: () => 1 };
maybe["two"] = () => 2;
const hit = maybe["one"];
console.log(hit === undefined ? -1 : hit());
console.log(maybe["gone"] === undefined);

// Overwrites are last-write-wins; the old closure drops.
maybe["one"] = () => 11;
const rebound = maybe["one"];
console.log(rebound === undefined ? -1 : rebound());

// A handler capturing its own registry (a cycle through the overflow
// map) still runs and tears down.
function makeRegistry(): void {
  const reg: Record<string, () => void> = {};
  reg["self"] = () => {
    console.log("keys:", Object.keys(reg).length);
  };
  reg["self"]();
}
makeRegistry();
makeRegistry();

// Declared func fields beside a func-valued signature: the hybrid shape.
type Hooks = { init: () => string; [k: string]: () => string };
const hooks: Hooks = { init: () => "init" };
hooks["after"] = () => "after";
console.log(hooks.init(), hooks["after"]());
console.log(Object.keys(hooks).join(","));
