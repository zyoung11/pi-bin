// `export { w as default }` is the OTHER default spelling — an export
// specifier, a LIVE binding in Node (the classic split with `export default w`).
let w = 10;
export { w as default };
export function bumpW(): void {
  w = 77;
}
