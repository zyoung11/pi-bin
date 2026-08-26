// String enums (no reverse mapping — member reads are the strings), const
// enums (inlined by definition), the numeric REVERSE mapping E[n] with
// compile-time-constant indices (later duplicate values overwrite earlier
// names, JS assignment order), forward element reads E["A"], and enum
// merging across two declarations of one name.
enum Msg {
  Hello = "HELLO",
  World = "WORLD",
  Empty = "",
}
const enum Level {
  Debug,
  Info,
  Warn = 10,
  Error,
}
enum Rev {
  A,
  B = 1,
  Alias = 1,
  C = 2,
}
enum Merged {
  X,
}
enum Merged {
  Y = 1,
}
console.log(Msg.Hello, Msg.World, JSON.stringify(Msg.Empty));
console.log(Level.Debug, Level.Info, Level.Warn, Level.Error);
console.log(Rev[0], Rev[1], Rev[2], Rev[Rev.A]);
console.log(Rev["B"], Msg["World"], Level["Warn"]);
console.log(Merged.X, Merged.Y, Merged[1], Merged["X"]);
let m: Msg = Msg.Hello;
m = Msg.World;
console.log(m === Msg.World, m.length, m.toLowerCase());
const lv: Level = Level.Error;
console.log(lv > Level.Warn, `${Msg.Hello} ${Level.Info}`);
let k: keyof typeof Msg = "Hello";
k = "Empty";
console.log(k);
