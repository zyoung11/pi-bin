// __island_eval only exists in --dynamic builds (the engine is linked); a
// static build must say so cleanly — a diagnostic naming the flag, not an
// ICE and never a C-level link error.
const r = __island_eval("6 * 7");
console.log(r);

function indirect(code: string): string {
  return __island_eval(code);
}
console.log(indirect("1 + 1"));
