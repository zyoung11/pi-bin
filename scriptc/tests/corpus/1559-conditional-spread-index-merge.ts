// Conditional spreads into PURE index-signature merge targets — the
// spawn-env HOST idiom: the condition evaluates once, the value lazily,
// and the empty arm leaves the key holding undefined (reads answer
// undefined; JSON and child-env builders drop it like an absent key).

type Env = { [k: string]: string | undefined };

let conds = 0;
function counted(v: string | undefined): string | undefined {
  conds++;
  return v;
}

function build(hostBind: string | undefined): Env {
  return {
    ...process.env,
    PORT: "3000",
    ...(counted(hostBind) ? { HOST: hostBind } : {}),
    FINAL: "yes",
  };
}

const env1 = build("127.0.0.1");
console.log(`${env1.HOST} ${env1.PORT} ${env1.FINAL}`);
const env2 = build(undefined);
console.log(env2.HOST === undefined, `${env2.PORT} ${env2.FINAL}`);
console.log("conds:", conds);

// The falsy-but-defined edge: "" is falsy, so the key stays unset.
const env3 = build("");
console.log(env3.HOST === undefined);

// Value laziness: the arm value only evaluates when the condition is true.
let evals = 0;
function loud(v: string): string {
  evals++;
  return v;
}
function pick(c: boolean): Env {
  return { ...(c ? { K: loud("on") } : {}), BASE: "b" };
}
console.log(`${pick(true).K}`, evals);
console.log(pick(false).K === undefined, evals);

// Either orientation of the ternary works.
function flipped(c: boolean): Env {
  return { ...(c ? {} : { OFF: "off" }) };
}
console.log(`${flipped(false).OFF}`, flipped(true).OFF === undefined);
console.log("done");
