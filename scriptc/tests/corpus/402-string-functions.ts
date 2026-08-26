function greet(who: string): string {
  return "hi " + who;
}
function shout(msg: string): string {
  return msg + "!";
}
function repeat(s: string, times: number): string {
  let out = "";
  for (let i = 0; i < times; i = i + 1) {
    out = out + s;
  }
  return out;
}
console.log(shout(greet("world")));
console.log(repeat("ab", 4));
console.log(repeat(greet("x"), 2));

function describe(n: number): string {
  if (n < 0) {
    return "negative";
  }
  if (n === 0) {
    return "zero";
  }
  return `positive (${n})`;
}
console.log(describe(-5), describe(0), describe(42));
