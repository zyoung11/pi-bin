class Point {
  x: number;
  y: number;
  label: string = "pt";
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  dist(other: Point): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return (dx * dx + dy * dy) ** 0.5;
  }
  describe(): string {
    return `${this.label}(${this.x}, ${this.y})`;
  }
  moveBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }
}
const a = new Point(0, 0);
const b = new Point(3, 4);
console.log(a.dist(b), b.dist(a), a.dist(a));
console.log(a.describe(), b.describe());
b.label = "far";
b.moveBy(10, 1);
b.y++;
console.log(b.describe());

// reference semantics and identity
const alias = a;
alias.x = 99;
console.log(a.x, a === alias, a === b, a !== b);

// default constructor (field initializers only)
class Settings {
  volume: number = 7;
  theme: string = "dark";
}
const s = new Settings();
console.log(s.volume, s.theme);
s.volume += 3;
console.log(s.volume);
