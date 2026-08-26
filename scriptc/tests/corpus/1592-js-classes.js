// JavaScript classes: fields declared by CONSTRUCTOR ASSIGNMENT (checkJs
// infers the property types), methods, getters, single inheritance with a
// virtual override dispatched through a base-typed element.
'use strict';

class Shape {
  /** @param {string} name */
  constructor(name) {
    this.name = name;
    this.hits = 0;
  }
  area() {
    return 0;
  }
  describe() {
    this.hits += 1;
    return `${this.name}: ${this.area()}`;
  }
  get tag() {
    return this.name.toUpperCase();
  }
}

class Rect extends Shape {
  /** @param {number} w @param {number} h */
  constructor(w, h) {
    super("rect");
    this.w = w;
    this.h = h;
  }
  area() {
    return this.w * this.h;
  }
}

class Square extends Rect {
  /** @param {number} side */
  constructor(side) {
    super(side, side);
  }
}

const shapes = [new Shape("blob"), new Rect(3, 4), new Square(5)];
for (const s of shapes) console.log(s.describe(), s.tag);
const r = new Rect(2, 6);
r.describe();
r.describe();
console.log("hits:", r.hits, "square?", shapes[2] instanceof Square, shapes[1] instanceof Square);
