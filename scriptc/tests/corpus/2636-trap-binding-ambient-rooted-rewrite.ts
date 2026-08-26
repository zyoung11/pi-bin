// @exit: 1
// A statement-position `c = <ambient-rooted chain>` does not count as a
// write against the trap claim (bindingEverWritten): that statement IS
// the RHS root's throw — Node evaluates the RHS first and dies there —
// so it never needs the binding's storage. Declining here pushed the
// declaration into the ordinary lowering, whose tagged-template tag
// (`obj["prop"]<Stuff>`) fenced as a dynamic keyed read (the
// taggedTemplatesWithTypeArguments1 regression). Both sides print
// "before" and throw obj's ReferenceError at the declaration.
interface Stuff {
  x: number;
  y: string;
}

declare let obj: {
  prop: <T>(strs: TemplateStringsArray, x: (input: T) => T) => {
    returnedObjProp: T;
  };
};

console.log("before");
export let c = obj["prop"]<Stuff> `${(input) => ({ ...input })}`;
c.returnedObjProp.x;
c = obj.prop<Stuff> `${(input) => ({ ...input })}`;
c.returnedObjProp.y;
console.log("unreachable");
