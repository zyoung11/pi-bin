// The option-table shapes: a union-typed source field narrowing into a
// plain slot through the width copy (the checked-arm extraction), an
// undefined-armed choices array whose element literals width-lift, and a
// `default` union holding its tuple arm built from a literal
// (`[{ value: [] }]` — the array-family arm route).
/**
 * @typedef {Object} ChoiceInfo
 * @property {boolean | string} value
 * @property {string} description
 * @property {string} [deprecated]
 *
 * @typedef {number | boolean | string | []} OptionValue
 * @typedef {OptionValue | [{ value: OptionValue }]} OptionValueInfo
 */
/** @type {{ [name: string]: { type: string, default?: OptionValueInfo, choices?: ChoiceInfo[] } }} */
const options = {
  endOfLine: {
    type: "choice",
    default: "lf",
    choices: [
      { value: "lf", description: "Line Feed only" },
      { value: "crlf", description: "CR + LF" },
    ],
  },
  plugins: {
    type: "path",
    default: [{ value: [] }],
  },
};

/** @type {{ description: string, value: string }[]} */
const narrowed = [
  { value: "lf", description: "Line Feed only" },
  { value: "crlf", description: "CR + LF" },
];
console.log(narrowed[1].value, narrowed[1].description);

console.log(options.endOfLine.type, options.endOfLine.default);
console.log(JSON.stringify(options.endOfLine.choices));
console.log(options.plugins.type, JSON.stringify(options.plugins.default));
console.log("done");
