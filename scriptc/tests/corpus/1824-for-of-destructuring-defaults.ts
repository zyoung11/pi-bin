// Object destructuring naming a field the source SHAPE does not carry
// (`{x = 1}` over `{}` — invariant signature 08): tsc types the binding from
// the default, JS always reads undefined there, so the default IS the
// binding — including later elements referencing earlier ones.
for (let { x = 1 } of [{}]) console.log(x);
for (const { a = "d", b = a + "!" } of [{}, {}]) console.log(a, b);
