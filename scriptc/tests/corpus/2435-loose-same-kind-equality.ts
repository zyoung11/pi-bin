// Same-kind loose equality IS strict equality (the spec's == dispatches to === when both operands share a type): typeof guards spelled with ==, numeric and string comparisons, and the existing == null idiom all lower exactly.
const v: unknown = { a: 1 };
console.log(typeof v == "object", typeof v != "string");
function check(x: number, s: string): boolean {
  return x == 42 && s != "no";
}
console.log(check(42, "yes"), check(41, "yes"), check(42, "no"));
let flag = true;
flag = !!flag;
console.log(flag == true, flag != true);
const maybe: string | null | undefined = "here" as string | null | undefined;
console.log(maybe == null, maybe != null);
const gone: string | null | undefined = null as string | null | undefined;
console.log(gone == null, gone != null);
