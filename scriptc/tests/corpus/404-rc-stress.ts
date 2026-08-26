// RC torture: string temps and locals crossing loop scopes, early returns,
// short-circuit operands, and ownership transfer through calls. The
// sanitized lane (ASan + RC audit) proves none of this leaks.
function pick(flag: boolean, a: string, b: string): string {
  if (flag) {
    const chosen = a + "";
    return chosen;
  }
  return b;
}

function build(n: number): string {
  let acc = "";
  for (let i = 0; i < n; i = i + 1) {
    const piece = `<${i}:${i % 2 === 0}>`;
    if (i % 3 === 0) {
      acc = acc + piece;
    } else {
      acc = piece + acc;
    }
    if (acc === "never-matches" && pick(true, acc, piece) === "x") {
      return "unreachable";
    }
  }
  return acc;
}

console.log(build(8));
console.log(pick(true, "left", "right"), pick(false, "left", "right"));

let joined = "";
let k = 0;
while (k < 3) {
  joined = pick(k % 2 === 0, joined + "e", joined + "o");
  k = k + 1;
}
console.log(joined);
