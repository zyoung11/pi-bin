// $<name> in replace/replaceAll templates (GetSubstitution's named arm)
// and \k<name> backreferences in patterns.
console.log("2024-07-15".replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/, "$<m>/$<d>/$<y>"));
console.log("a1b2c3".replace(/(?<digit>\d)/g, "[$<digit>]"));
console.log("a1b2c3".replaceAll(/(?<digit>\d)/g, "<$<digit>>"));

// Mixed numbered and named references in one template.
console.log("john smith".replace(/(?<first>\w+) (\w+)/, "$2, $<first> ($1 $2)"));

// A nonexistent group name substitutes empty (Get → undefined → "").
console.log("a".replace(/(?<x>a)/, "[$<x>][$<nope>]"));

// No named groups in the pattern → namedCaptures is undefined and $< is
// literal; an unterminated $<name is literal even WITH named groups.
console.log("a".replace(/a/, "[$<x>]"));
console.log("a".replace(/(?<x>a)/, "[$<x]"));

// A nonparticipating named group substitutes empty; duplicates across
// alternatives resolve to the participating occurrence.
console.log("ab".replace(/(?<a>a)|(?<b>b)/g, "<$<a>|$<b>>"));
console.log("14px 9em".replace(/(?<n>\d+)px|(?<n>\d+)em/g, "[$<n>]"));

// $` and $' still compose around named references.
console.log("xyz".replace(/(?<mid>y)/, "($`|$<mid>|$')"));

// \k<name> backreferences: quote matching, case-insensitive reuse.
const quoted = /(?<q>['"]).*?\k<q>/;
console.log(quoted.test('say "hi" ok'), quoted.test("say 'hi ok"));
console.log(/(?<tag>[a-z]+)-\k<tag>/i.test("Abc-ABC"), /(?<tag>[a-z]+)-\k<tag>/.test("abc-xyz"));
console.log("noon moon".replace(/(?<c>[a-z])\k<c>/g, "[$<c>$<c>]"));

// Named groups under /u with non-ASCII subjects: UTF-16-exact slices.
console.log("héllo wörld".replace(/(?<w>\wö\w+)/u, "«$<w>»"));

// source/flags of a named-group regex are the literal's own text.
const re = /(?<a>x)\k<a>/gi;
console.log(re.source, re.flags);
