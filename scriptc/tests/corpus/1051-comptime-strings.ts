// comptime string assembly: banners and generated text built at compile
// time with real JS string semantics, baked as string literals.
const banner = comptime(() => {
  const title = "scriptc";
  const width = title.length + 6;
  const edge = "+" + "-".repeat(width - 2) + "+";
  const mid = "|  " + title + "  |";
  return edge + "\n" + mid + "\n" + edge;
});
console.log(banner);

// Loops + template literals + the ambient string surface (slice/repeat/...)
// all run as ordinary JavaScript inside the island.
const ruler = comptime(() => {
  let line = "";
  for (let i = 1; i <= 5; i++) {
    line += `${i}${".".repeat(i)}`;
  }
  return line.slice(0, line.length - 1);
});
console.log(ruler, ruler.length);

// Baked strings are ordinary runtime strings.
console.log(banner.includes("scriptc"), ruler.charAt(0), ruler.indexOf("4"));

// Unicode survives the bake byte-for-byte.
const arrows = comptime(() => "→".repeat(3) + " done ✓");
console.log(arrows, arrows.length);
