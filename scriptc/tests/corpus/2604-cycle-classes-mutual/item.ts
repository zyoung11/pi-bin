// A CLASS cycle: Item and Group live in mutually-importing modules and
// construct each other from methods. Both top levels are declaration-only
// and every cycle-crossing reference sits inside a method body, so the
// cycle is admitted — Node runs it as a cache hit and nothing observes
// the partial initialization.
import { Group } from "./group.ts";

export class Item {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
  crew(n: number): Group {
    return new Group(this.name, n);
  }
  describe(): string {
    return "item:" + this.name;
  }
}
