// The exporting module: a generic class (family statics included) and a
// generic function both instantiated from the importer.
export class Store<T> {
  static count = 0;
  items: T[] = [];
  add(v: T): Store<T> {
    this.items.push(v);
    Store.count = Store.count + 1;
    return this;
  }
  get size(): number {
    return this.items.length;
  }
}
export function keep<T>(v: T): T {
  return v;
}
// An instantiation demanded by the EXPORTING module itself shares the
// family (and its statics) with the importer's instantiations.
export const local = new Store<number>().add(10);
