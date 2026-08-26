try {
  throw "boom";
} catch ({ message }: any) {
  console.log("destructuring catch bindings are fenced");
}
function f(): number {
  try {
    console.log("body");
  } finally {
    // return crossing OUT of a try/catch body compiles now; a return
    // INSIDE the finally body (replacing the pending completion) stays out.
    return 1;
  }
}
for (let i = 0; i < f(); i = i + 1) {
  try {
    if (i === 2) {
      break;
    }
  } finally {
    console.log("per-iteration cleanup");
  }
  while (i > 0) {
    try {
      console.log(i);
    } finally {
      continue;
    }
  }
}
