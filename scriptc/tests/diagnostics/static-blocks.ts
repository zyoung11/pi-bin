// Static-block FENCES — every unlowerable shape must fail the compile, never
// silently drop the block (the classStaticBlock13 miscompile: an unreferenced
// class's deferred diagnostics vanished along with the block's side effects).

// `this` inside a static block names the class constructor — no value form.
class UsesThis {
  static {
    const me = this;
  }
}

// An unreferenced class whose collection poisons for ANOTHER reason still
// reports eagerly when it carries a static block: the block would have run
// under Node, so deferral may not swallow it. (#private members lower now,
// so the poison here is an auto-accessor field.)
class NeverReferenced {
  accessor hidden = 1;
  static {
    console.log("must not be dropped");
  }
}

// The classStaticBlock13 shape retired: a static #private FIELD reads
// through the declaring class's name like any static (corpus 2452). The
// static-accessor half of the family still has no lowering — the use site
// in the block fences by name.
class PrivateStatic {
  static get #x(): number {
    return 123;
  }

  static {
    console.log(PrivateStatic.#x);
  }
}
