// JS-lane static blocks (salsa/checkJs inference): the block assigns a
// module binding and runs at the class statement whether or not the class
// is referenced — same declaration-time contract as the .ts lane.
let seen = 0;

class Unreferenced {
  static {
    seen = 42;
  }
}

console.log(seen);

let order = "";
class C {
  static {
    order += "first;";
  }
  static {
    order += "second;";
  }
}
console.log(order);
