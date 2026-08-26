// A default export of an object literal of closures — the colors-module
// pattern (portless): `export default { ... }` evaluates AT ITS SOURCE
// POSITION in the module's init (after the wraps below exist).
console.log("colors init");

const wrap = (open: string, close: string) => {
  return (s: string) => `[${open}]${s}[${close}]`;
};
const plain = (s: string) => s;

const bold = wrap("1", "22");
const red = wrap("31", "39");

export default { bold, red, plain };
