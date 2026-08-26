// Evaluation ORDER: static blocks interleave with static readonly field
// initializers in member order, at the class statement's source position
// relative to the surrounding top-level statements — and a later class's
// block sees an earlier class's initialized statics.
function mark(tag: string, v: number): number {
  console.log("eval", tag);
  return v;
}

console.log("top before A");

class A {
  static readonly one = mark("A.one", 1);
  static {
    console.log("A block 1");
  }
  static readonly two = mark("A.two", A.one + 1);
  static {
    console.log("A block 2, two =", A.two);
  }
}

console.log("top between");

class B {
  static {
    console.log("B block reads A.two =", A.two);
  }
}

console.log("top after B", A.one, A.two);

// Block bodies are real blocks: let/const scope to the block, loops and
// inner function declarations work, and shadowing the module binding
// inside the block leaves the outer binding alone.
const s = "outer";
class Scoped {
  static {
    for (let i = 0; i < 2; i++) console.log("loop", i);
    const s = "inner";
    function twice(x: number): number {
      return x * 2;
    }
    console.log(s, twice(21));
  }
}
console.log(s);
