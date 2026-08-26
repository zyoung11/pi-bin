// Checker-level regex fences: function replacements — tsc rejects them
// before lowering starts. (exec lowers through the match intrinsic and
// `new RegExp(pattern, flags)` compiles now, so neither appears here.)
const m = /a(b)/.exec("ab");
const fn = "abc".replace(/b/, (s: string) => s);
