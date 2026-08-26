// The external-repro shape: a small AST as mutually recursive records
// under a discriminated union, walked with recursion and reduce — the
// parser/AST workload recursive record types unlock.
interface TreeNode { label: string; children: TreeNode[] }

interface NumLit { kind: "num"; value: number }
interface BinOp { kind: "bin"; op: string; left: Expr; right: Expr }
interface CallExpr { kind: "call"; name: string; args: Expr[] }
type Expr = NumLit | BinOp | CallExpr;

// (1 + 2) * max(3, 4 - 1, 5)
const ast: Expr = {
  kind: "bin",
  op: "*",
  left: { kind: "bin", op: "+", left: { kind: "num", value: 1 }, right: { kind: "num", value: 2 } },
  right: {
    kind: "call",
    name: "max",
    args: [
      { kind: "num", value: 3 },
      { kind: "bin", op: "-", left: { kind: "num", value: 4 }, right: { kind: "num", value: 1 } },
      { kind: "num", value: 5 },
    ],
  },
};

function evaluate(e: Expr): number {
  switch (e.kind) {
    case "num":
      return e.value;
    case "bin": {
      const l = evaluate(e.left);
      const r = evaluate(e.right);
      if (e.op === "+") return l + r;
      if (e.op === "-") return l - r;
      if (e.op === "*") return l * r;
      return NaN;
    }
    case "call":
      return e.args.reduce((best, a) => Math.max(best, evaluate(a)), -Infinity);
  }
}

function print(e: Expr): string {
  switch (e.kind) {
    case "num":
      return String(e.value);
    case "bin":
      return "(" + print(e.left) + " " + e.op + " " + print(e.right) + ")";
    case "call":
      return e.name + "(" + e.args.map(print).join(", ") + ")";
  }
}

function size(e: Expr): number {
  switch (e.kind) {
    case "num":
      return 1;
    case "bin":
      return 1 + size(e.left) + size(e.right);
    case "call":
      return e.args.reduce((acc, a) => acc + size(a), 1);
  }
}

console.log(print(ast));
console.log(evaluate(ast));
console.log(size(ast));

// The reduce-over-children tree fold on the canonical interface.
const tree: TreeNode = {
  label: "root",
  children: [
    { label: "a", children: [{ label: "a1", children: [] }] },
    { label: "b", children: [] },
  ],
};
function fold(n: TreeNode): number {
  return n.children.reduce((acc, c) => acc + fold(c), 1);
}
function deepest(n: TreeNode): number {
  return n.children.reduce((best, c) => Math.max(best, deepest(c) + 1), 1);
}
console.log(fold(tree), deepest(tree));
