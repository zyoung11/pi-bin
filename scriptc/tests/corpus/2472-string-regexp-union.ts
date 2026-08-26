// The skip-utility shape: a `string | RegExp` parameter dispatching on
// `instanceof RegExp` (the union's regex-arm tag test), the RegExp arm
// driving .test and the string arm .includes; plus a `RegExp | undefined`
// slot narrowing by tag.
function skip(characters: string | RegExp): (text: string, startIndex: number) => number {
  return (text, startIndex) => {
    let cursor = startIndex;
    while (cursor >= 0 && cursor < text.length) {
      const character = text.charAt(cursor);
      if (characters instanceof RegExp) {
        if (!characters.test(character)) {
          return cursor;
        }
      } else if (!characters.includes(character)) {
        return cursor;
      }
      cursor++;
    }
    return cursor;
  };
}

const skipWhitespace = skip(/\s/);
const skipSpaces = skip(" \t");
console.log(skipWhitespace("  \t hi", 0));
console.log(skipSpaces("  \t hi", 0));
console.log(skipWhitespace("abc", 0));

const table = new Map<string, RegExp>([
  ["lf", /\n/],
  ["crlf", /\r\n/],
]);
const re: RegExp | undefined = table.get("lf");
if (re !== undefined) {
  console.log(re.source, re.test("a\nb"));
}
console.log(table.get("nope") === undefined, table.size);
console.log("done");
