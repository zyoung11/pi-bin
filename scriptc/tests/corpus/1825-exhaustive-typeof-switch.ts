// A non-void function whose completion tsc proves by switch EXHAUSTIVENESS
// (every typeof arm returns — invariant signature 16): the conservative
// must-return analysis cannot see it, so the body ends in the appended
// unreachable trap instead of an ICE — and the trap never fires.
const kindOf = (x: unknown): number => {
  switch (typeof x) {
    case "string": return 1;
    case "number": return 2;
    case "bigint": return 3;
    case "boolean": return 4;
    case "symbol": return 5;
    case "undefined": return 6;
    case "object": return 7;
    case "function": return 8;
  }
};
console.log(kindOf("s"), kindOf(3), kindOf(true), kindOf(undefined), kindOf(null));
