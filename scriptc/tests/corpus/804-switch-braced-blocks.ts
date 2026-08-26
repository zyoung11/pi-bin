// Braced case bodies (their own lexical scope) and bare blocks generally.
function pick(n: number): string {
  switch (n) {
    case 0: {
      const label = "zero";
      return label;
    }
    case 1: {
      let s = `one(${n})`;
      s += "!";
      return s;
    }
    default: {
      return "many";
    }
  }
}
console.log(pick(0), pick(1), pick(7));

// braced cases with break, inside a loop, with RC values
let out = "";
for (let i = 0; i < 4; i++) {
  switch (i % 2) {
    case 0: {
      const tag = `e${i}`;
      out += tag;
      break;
    }
    default: {
      out += `o${i}`;
    }
  }
}
console.log(out);

// bare blocks as scopes
{
  const x = "inner";
  console.log(x);
}
const x = "outer";
{
  const shadow = x + "!";
  console.log(shadow);
}
console.log(x);
