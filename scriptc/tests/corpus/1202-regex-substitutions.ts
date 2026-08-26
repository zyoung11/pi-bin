// GetSubstitution: $$, $&, $` and $', $1..$99, out-of-range left literal.
console.log("xaybz".replace(/a|b/g, "[$&]"));
console.log("hello world".replace(/world/, "<$`|$&|$'>"));
console.log("100%".replace(/%/, "$$"));

// Group references, reordering.
console.log("key=value".replace(/(\w+)=(\w+)/, "$2 <- $1"));

// $01 (two-digit spelling of group 1); $2 out of range stays literal; $10
// with only one group falls back to group 1 + literal '0'.
console.log("abc".replace(/(b)/, "<$01|$1|$2|$10>"));

// $9 with no groups at all: literal.
console.log("abc".replace(/b/, "[$9]"));

// Unmatched optional group substitutes empty.
console.log("ac".replace(/a(x)?c/, "[$1]"));

// A '$' with nothing meaningful after it is literal.
console.log("abc".replace(/b/, "$"), "abc".replace(/b/, "q$"));

// $<...> stays literal when the pattern has no named groups.
console.log("abc".replace(/b/, "$<name>"));

// Substitutions in a global replace use each match's own position.
console.log("a1b2".replace(/\d/g, "($`)"));

// Ten groups: $10 resolves as the two-digit reference when in range.
console.log(
  "abcdefghij".replace(/(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)/, "$10$9$1"),
);
