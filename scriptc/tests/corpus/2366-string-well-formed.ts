// String.prototype.isWellFormed / toWellFormed (ES2024): constant true and
// the identity over the runtime's well-formed storage — ASCII, BMP, and
// astral receivers, results feeding comparisons and further methods.
const plain = "hello";
const accents = "café naïve";
const astral = "wave \u{1F30A} and \u{1D306} tetragram";
const empty = "";
console.log(plain.isWellFormed(), accents.isWellFormed(), astral.isWellFormed(), empty.isWellFormed());
console.log(plain.toWellFormed(), accents.toWellFormed());
console.log(astral.toWellFormed() === astral, empty.toWellFormed().length);
const parts: string[] = [];
for (const s of [plain, accents, astral]) {
  parts.push(`${s.isWellFormed()}:${s.toWellFormed().length}`);
}
console.log(parts.join(","));
const replacement = "� literal replacement �";
console.log(replacement.isWellFormed(), replacement.toWellFormed() === replacement);
console.log(astral.toWellFormed().toUpperCase());
