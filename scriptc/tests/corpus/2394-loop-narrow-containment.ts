// Narrowing established by an in-loop break guard ends with the loop body — post-loop and post-branch reads must re-test the optional.
interface Sel { readonly value: number; }
interface Model { readonly sel: Sel | null; readonly count: number; }
function drain(model: Model): number {
  let total = 0;
  let i = 0;
  while (i < model.count) {
    if (model.sel === null) break;
    total += model.sel.value;
    i += 1;
  }
  return model.sel === null ? total : total + model.sel.value;
}
function pick(flag: boolean, model: Model): number {
  let total = 0;
  for (let i = 0; i < model.count; i += 1) {
    if (flag) {
      if (model.sel === null) break;
      total += model.sel.value;
    }
    total += model.sel === null ? 0 : model.sel.value;
  }
  return total;
}
console.log(drain({ sel: { value: 4 }, count: 3 }));
console.log(drain({ sel: null, count: 3 }));
console.log(pick(true, { sel: { value: 2 }, count: 2 }));
console.log(pick(false, { sel: null, count: 2 }));
