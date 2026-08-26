// Object.freeze on fresh literals and primitives (identity — no alias
// exists, so the frozen bit is unobservable), Promise.resolve (plain
// values fulfill a fresh promise; a promise argument passes through by
// IDENTITY, the spec's native-promise rule), the handler-less
// then()/catch()/finally() passthroughs (fresh promises adopting the
// receiver's settlement — never the receiver itself), arguments.length
// as the fixed-arity constant, and hasOwnProperty on class constructors
// (own statics are compile-time-known). Node is the oracle.

class C {
  P(ii: number, j: number, k: number) {
    for (var i = 0; i < arguments.length; i++) { console.log("arg", i); }
  }
}
new C().P(1, 2, 3);

class A { static foo = 1; static bar() { return 2; } }
class B extends A { }
console.log(A.hasOwnProperty('foo'), A.hasOwnProperty('nope'), A.hasOwnProperty('prototype'), A.hasOwnProperty('bar'), B.hasOwnProperty('foo'), B.hasOwnProperty('prototype'));

const o = Object.freeze({ a: 1, foo() { return 2; } });
console.log(o.a, o.foo());
const s = Object.freeze('a');
console.log(s);
console.log(Object.freeze(42), Object.freeze(true));
console.log(Object.freeze([1, 2, 3]).length);

const assigned = Object.assign({}, { test: true, n: 3 });
console.log(assigned.test, assigned.n);

async function f() { return await Promise.resolve(42); }
f().then((v) => { console.log("resolved", v); });
const pr = Promise.resolve("str");
pr.then((v) => { console.log("s", v); });
const pident: Promise<string> = Promise.resolve(pr);
pident.then((v) => { console.log("ident", v, pident === pr); });
async function g() {
  const a = await Promise.resolve(7).then();
  const b = await Promise.resolve(8).catch();
  const c = await Promise.resolve(9).finally();
  const d = await Promise.resolve(10).then(undefined);
  const e = await Promise.resolve(11).catch(null);
  console.log(a, b, c, d, e);
  const p0 = Promise.resolve(1);
  console.log(p0.then() === p0);
  const rej: Promise<number> = Promise.reject(new Error("boom"));
  try {
    await rej.catch();
  } catch (err) {
    console.log("caught", err instanceof Error ? err.message : "?");
  }
}
g();
