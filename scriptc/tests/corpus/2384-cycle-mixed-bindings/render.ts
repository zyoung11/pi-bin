import { WIDTH, NAME, describeWidth } from "./config.ts";
export function renderWidth(): string {
  return String(WIDTH * 2);
}
export function banner(): string {
  return "[" + NAME + "] " + describeWidth();
}
