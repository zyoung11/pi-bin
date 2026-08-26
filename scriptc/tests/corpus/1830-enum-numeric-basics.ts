// Numeric enums: auto-increment from zero, explicit initializers resuming
// the sequence, const-foldable initializer expressions (tsc's own constant
// computation — arithmetic, shifts, bitwise ops, member references), and
// member reads folding to plain numbers that compare, add, and format
// exactly like Node's enum-object reads.
enum Direction {
  Up = 1,
  Down,
  Left,
  Right,
}
enum Flags {
  None = 0,
  A = 1 << 0,
  B = 1 << 1,
  C = 1 << 2,
  AB = A | B,
  All = A | B | C,
  Masked = All & ~B,
}
enum Seq {
  First = -3,
  Second,
  Third = 2 ** 4,
  Fourth,
  Half = 7 / 2,
  Mod = 17 % 5,
}
console.log(Direction.Up, Direction.Down, Direction.Left, Direction.Right);
console.log(Flags.None, Flags.A, Flags.B, Flags.AB, Flags.All, Flags.Masked);
console.log(Seq.First, Seq.Second, Seq.Third, Seq.Fourth, Seq.Half, Seq.Mod);
console.log(Direction.Up + Direction.Right, Flags.AB === 3, Seq.First < 0);
function move(d: Direction): string {
  switch (d) {
    case Direction.Up:
      return "up";
    case Direction.Down:
      return "down";
    case Direction.Left:
      return "left";
    default:
      return "right";
  }
}
console.log(move(Direction.Up), move(Direction.Down), move(Direction.Right));
let d: Direction = Direction.Left;
d = Direction.Up;
console.log(d, `${Direction.Down}!`);
