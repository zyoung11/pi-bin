// Map values of RegExp: the per-EOL pattern table — the array-element
// regex story, map form.
const regexps = new Map<string, RegExp>();
regexps.set("lf", /\n/);
regexps.set("cr", /\r/);
const lf = regexps.get("lf");
console.log(lf !== undefined && lf.test("a\nb"), regexps.size);
regexps.delete("cr");
console.log(regexps.has("cr"), regexps.size);
console.log("done");
