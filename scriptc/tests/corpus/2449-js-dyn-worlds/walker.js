'use strict';
// A #private class: collection fences it (deferred to runtime in JS), so
// every type slot naming it must still emit valid code.
class TreePath {
  #stack;
  constructor(value) {
    this.#stack = [value];
  }
  get parent() {
    return this.#stack.at(-2);
  }
}
export default TreePath;
