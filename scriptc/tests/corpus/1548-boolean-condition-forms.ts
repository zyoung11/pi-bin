// Boolean(x) is condition position: `&&`/`||` operands descend as
// ToBoolean'd conditions (short-circuit preserved), so mixed-kind operands
// with no value representation — a record and a bool — test fine. The
// tailscale hasCapability idiom: Boolean(capMap && Object.keys(capMap).some(p)).
function hasCapability(
  capMap: { [key: string]: unknown } | undefined,
  predicate: (value: string) => boolean,
): boolean {
  return Boolean(capMap && Object.keys(capMap).some(predicate));
}

const isHttps = (value: string): boolean => value === "https" || value.endsWith("/https");

console.log(hasCapability(undefined, isHttps));
console.log(hasCapability({}, isHttps));
console.log(hasCapability({ ssh: true }, isHttps));
console.log(hasCapability({ ssh: true, "funnel/https": 1 }, isHttps));

// Short-circuit is observable: the right side must not evaluate when the
// left is falsy.
let evaluated = 0;
function probe(): boolean {
  evaluated++;
  return true;
}
const nothing: string | undefined = undefined;
console.log(Boolean(nothing && probe()));
console.log(evaluated);
const something: string | undefined = "yes";
console.log(Boolean(something && probe()));
console.log(evaluated);

// || descends too, and the plain value forms keep their exact ToBoolean.
console.log(Boolean(nothing || something));
console.log(Boolean(0), Boolean(-0), Boolean(0 / 0), Boolean(2));
console.log(Boolean(""), Boolean("no"));
const rec = { a: 1 };
console.log(Boolean(rec), Boolean([] as number[]));
console.log(Boolean());
