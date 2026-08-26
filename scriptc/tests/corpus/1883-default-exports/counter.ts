// A named default CLASS declaration, plus `export { x as default }`-style
// aliasing exercised from the importer side.
export default class Counter {
  n = 0;
  bump(): number {
    this.n += 1;
    return this.n;
  }
}
