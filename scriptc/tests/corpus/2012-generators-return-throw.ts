// .return(v): completes without running an unstarted body; injects a
// return completion at a suspended yield (finallys run, catch does NOT
// catch it); a finally that yields RESISTS the return — the parked value
// delivers after the finally drains. .throw(e): catchable by the body,
// propagates when uncaught, and a non-suspended generator becomes done
// with the payload thrown at the call site.
function* g1(): Generator<number, number, unknown> {
  console.log("never runs");
  yield 1;
  return 0;
}
const i1 = g1();
const r1 = i1.return(5);
console.log(r1.done === true, r1.value as number);
console.log(i1.next().done === true);

function* g2(): Generator<number, number, unknown> {
  try {
    yield 1;
    yield 2;
  } catch {
    console.log("catch must not run");
  } finally {
    console.log("fin2");
  }
  return 0;
}
const i2 = g2();
console.log(i2.next().value as number);
const r2 = i2.return(7);
console.log(r2.done === true, r2.value as number);

function* g3(): Generator<number, number, unknown> {
  try {
    yield 1;
  } finally {
    console.log("fin3");
    yield 2;
    console.log("fin3b");
  }
  return 0;
}
const i3 = g3();
i3.next();
const r3 = i3.return(9);
console.log(r3.done === true, r3.value as number);
const r3b = i3.next();
console.log(r3b.done === true, r3b.value as number);

function* g4(): Generator<string, void, unknown> {
  try {
    yield "a";
  } catch (e) {
    if (e instanceof Error) console.log("caught", e.message);
  }
  yield "after";
}
const i4 = g4();
i4.next();
const t4 = i4.throw(new Error("boom"));
console.log(t4.done === true, t4.value as string);
console.log(i4.next().done === true);

function* g5(): Generator<number, void, unknown> {
  yield 1;
}
const i5 = g5();
i5.next();
try {
  i5.throw(new Error("prop"));
} catch (e) {
  if (e instanceof Error) console.log("propagated", e.message);
}
console.log(i5.next().done === true);

// .throw on an unstarted generator: body never runs, generator done
const i6 = g5();
try {
  i6.throw(new Error("early"));
} catch (e) {
  if (e instanceof Error) console.log("early", e.message);
}
console.log(i6.next().done === true);

// a body exception surfaces at the next() that runs it
function* g7(): Generator<number, void, unknown> {
  yield 1;
  throw new Error("body");
}
const i7 = g7();
i7.next();
try {
  i7.next();
} catch (e) {
  if (e instanceof Error) console.log("bodyerr", e.message);
}
console.log(i7.next().done === true);

// .return on a DONE generator still answers the value
function* g7b(): Generator<number, number, unknown> {
  yield 1;
  return 0;
}
const i7b = g7b();
i7b.next();
i7b.next();
const r7 = i7b.return(11);
console.log(r7.done === true, r7.value as number);

// a throw INSIDE the finally replaces the return completion
function* g8(): Generator<number, number, unknown> {
  try {
    yield 1;
  } finally {
    throw new Error("fin-throw");
  }
}
const i8 = g8();
i8.next();
try {
  i8.return(3);
} catch (e) {
  if (e instanceof Error) console.log("replaced", e.message);
}
console.log(i8.next().done === true);
