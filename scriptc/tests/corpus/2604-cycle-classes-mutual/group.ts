import { Item } from "./item.ts";

export class Group {
  readonly label: string;
  readonly count: number;
  constructor(label: string, count: number) {
    this.label = label;
    this.count = count;
  }
  lead(): Item {
    return new Item(this.label + "-lead");
  }
  roster(): string {
    return this.lead().describe() + " x" + String(this.count);
  }
}
