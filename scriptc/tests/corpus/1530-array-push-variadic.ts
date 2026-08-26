// Array.prototype.push, the variadic forms: N arguments append in order
// and the call returns the new length; zero arguments is Node's no-op that
// returns the unchanged length; every argument evaluates BEFORE any append
// (an argument reading the array sees the pre-push state). Scalar and ref
// (string/record) elements both flow — the portless spawn-args idiom
// (args.push("--port", port.toString())).
const nums: number[] = [1];
console.log(nums.push(2, 3));
console.log(nums.push(4, 5, 6, 7));
console.log(nums.push());
console.log(JSON.stringify(nums));

// All arguments evaluate before any append: the second argument reads the
// pre-push length in JS, and so here.
const order: number[] = [10];
console.log(order.push(order.length, order.length));
console.log(JSON.stringify(order));

// String elements — the args.push("--flag", value) shape.
const args: string[] = ["run"];
const port = 3000;
args.push("--port", port.toString());
args.push("--cert", "c.pem", "--key", "k.pem");
console.log(args.push());
console.log(JSON.stringify(args));

// Record elements: ownership moves into the array; reads see the same refs.
interface Row {
  id: number;
  tag: string;
}
const rows: Row[] = [];
const a: Row = { id: 1, tag: "a" };
console.log(rows.push(a, { id: 2, tag: "b" }, { id: 3, tag: "c" }));
rows[1]!.tag = "B";
console.log(JSON.stringify(rows));

// Union elements: plain arm values wrap like single-arg push does.
const opt: (string | undefined)[] = [];
opt.push("x", undefined, "y");
console.log(opt.length, opt[0] ?? "-", opt[1] === undefined, opt[2] ?? "-");

// The return value in expression position.
const total = nums.push(8, 9) + args.push("--tld", "test");
console.log(total, nums.length, args.length);
