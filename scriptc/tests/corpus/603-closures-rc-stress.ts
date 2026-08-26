// RC torture for closures: closures capturing strings/arrays created and
// dropped in loops, reassigned function-typed locals, closures escaping
// through returns and parameters. The sanitized lane proves no leaks.
function makeGreeter(name: string): () => string {
  const greeting = "hello " + name;
  return () => greeting + "!";
}

let lastGreet = () => "none";
for (let i = 0; i < 5; i++) {
  lastGreet = makeGreeter(`user${i}`); // previous closure + its captures die
}
console.log(lastGreet());

function compose(f: (s: string) => string, g: (s: string) => string): (s: string) => string {
  return (s: string) => g(f(s));
}
const wrap = (s: string) => `(${s})`;
const upperMark = (s: string) => s + "^";
let chained = wrap;
for (let i = 0; i < 3; i++) {
  chained = compose(chained, i % 2 === 0 ? wrap : upperMark);
}
console.log(chained("x"));

// closures capturing arrays; array contents flowing through closures
function accumulate(): string {
  const seen: string[] = [];
  const record = (s: string) => {
    seen.push(s);
    return seen.length;
  };
  record("a");
  record("b");
  const summarize = () => `${seen.length}:${seen[0]}${seen[1]}${seen[2]}`;
  record("c");
  return summarize();
}
console.log(accumulate());

// conditional closure churn with ternaries and logical operators
function pick(flag: boolean): () => string {
  const heavy = () => "heavy" + "!".repeat(3);
  const light = () => "light";
  return flag ? heavy : light;
}
console.log(pick(true)(), pick(false)());

// deeply nested captures across three function levels
function level1(a: string): () => () => string {
  return () => {
    const b = a + "+L2";
    return () => b + "+L3";
  };
}
console.log(level1("L1")()());
