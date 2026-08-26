// Destructuring ASSIGNMENT to existing bindings — statement position:
// `({ a, b } = e);` evaluates e once, then assigns each property in source
// order (the assignment twin of destructuring declarations). Shorthand and
// renamed targets, module globals, captured bindings, and an async RHS.
interface State {
  dir: string;
  port: number;
  tls: boolean;
  tlds: string[];
}

function discover(n: number): State {
  console.log(`discover(${n})`); // must print exactly once per assignment
  return { dir: `/tmp/s${n}`, port: 3000 + n, tls: n % 2 === 0, tlds: [`t${n}.test`] };
}

let dir = "";
let port = 0;
let tls = false;
let tlds: string[] = [];

({ dir, port, tls, tlds } = discover(1));
console.log(dir, port, tls, JSON.stringify(tlds));

// Renamed targets: `{ field: variable }`.
let d2 = "";
let p2 = 0;
({ dir: d2, port: p2 } = discover(2));
console.log(d2, p2);

// Inside a function, assigning locals of the enclosing scope (boxed).
function refresh(): () => void {
  let inner = "";
  const update = (): void => {
    ({ dir: inner } = discover(3));
  };
  update();
  console.log(`inner: ${inner}`);
  return update;
}
refresh();

// An async RHS: the awaited value destructures the same way.
async function discoverAsync(): Promise<State> {
  return discover(4);
}
async function main(): Promise<void> {
  ({ dir, port, tls, tlds } = await discoverAsync());
  console.log(dir, port, tls, JSON.stringify(tlds));
}
main();
