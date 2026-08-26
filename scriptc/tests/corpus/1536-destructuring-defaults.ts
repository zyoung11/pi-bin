// Defaults in OBJECT destructuring patterns (declarations AND destructured
// parameters — one shared desugar): each default applies exactly when the
// field holds the undefined arm, evaluates lazily in element order, and
// may reference names bound by EARLIER elements (`tlds = [tld]` — JS's
// left-to-right rule). Renamed bindings and untouched required fields mix
// freely.
interface Opts {
  port: number;
  tld?: string;
  tlds?: string[];
  strict?: boolean;
  label?: string;
}

function create(options: Opts): string {
  const { port, tld = "localhost", tlds = [tld], strict = true, label: name = `srv-${port}` } = options;
  return `${port}:${tld}:${tlds.join("+")}:${strict}:${name}`;
}
console.log(create({ port: 1 }));
console.log(create({ port: 2, tld: "dev", strict: false }));
console.log(create({ port: 3, tlds: ["x", "y"], label: "custom" }));
console.log(create({ port: 4, tld: undefined, tlds: undefined, strict: undefined }));

// Destructured PARAMETER with element defaults — the same machinery
// through the hidden ABI slot.
function serve({ tld = "local", strict = false, port }: Opts): string {
  return `${tld}|${strict}|${port}`;
}
console.log(serve({ port: 10 }));
console.log(serve({ port: 11, tld: "t", strict: true }));

// Defaults evaluate ONLY when the field is undefined (lazy, per element).
let evals = 0;
function dflt(): string {
  evals++;
  return "computed";
}
function probe(o: Opts): string {
  const { tld = dflt() } = o;
  return tld;
}
console.log(probe({ port: 0, tld: "present" }), evals);
console.log(probe({ port: 0 }), evals);

// Arrow parameter patterns share the path.
const fmt = ({ port, tld = "arrow" }: Opts): string => `${port}@${tld}`;
console.log(fmt({ port: 20 }), fmt({ port: 21, tld: "given" }));
