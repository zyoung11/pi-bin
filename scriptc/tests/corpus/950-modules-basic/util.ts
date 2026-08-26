export const base: number = 10;
export let counter: number = 0;
export function bump(): number {
  counter += 1;
  return counter;
}
export class Tally {
  total: number = 0;
  label: string;
  constructor(label: string) {
    this.label = label;
  }
  add(n: number): string {
    this.total += n;
    return `${this.label}=${this.total}`;
  }
}
console.log("util init", base);
