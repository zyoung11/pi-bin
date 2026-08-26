// `new Object()` is the empty record — the `{}` literal's twin (fresh
// identity, no own properties): cast targets and JSON round-trips behave
// identically. `new String(x)` in a template span is the argument's own
// ToString (the wrapper is only distinguishable via typeof/identity,
// neither observable where the value immediately stringifies).
interface Foo { }
var xx = new Object() as Foo;
console.log(typeof xx);
console.log(JSON.stringify(new Object()));
var greeting = `abc${ new String("Hi") }def`;
console.log(greeting);
console.log(`empty:${new String()}|num:${new String(42 as number | string)}|bool:${new String(true)}`);
