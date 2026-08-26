import { renderWidth } from "./render.ts";
export const WIDTH: number = 42;
export const NAME: string = "cfg";
export function describeWidth(): string {
  return NAME + ":" + renderWidth();
}
