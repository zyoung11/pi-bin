// The portless colors.ts shape: Object.assign(fn, { props }) builds the
// function-with-properties hybrid (`F & { bold: F }` — the chalk shape).
const wrap = (open: string, close: string) => {
  return (s: string) => `[${open}]${s}[${close}]`;
};
const identity = (s: string) => s;
const bold = wrap("1", "22");
const dim = wrap("2", "22");
const red = wrap("31", "39");
const green = identity;
const blue = Object.assign(identity, { bold } as { bold: (s: string) => string });
const cyan = Object.assign(wrap("36", "39"), { bold } as { bold: (s: string) => string });
const gray = dim;
export default { bold, dim, red, green, blue, cyan, gray };
