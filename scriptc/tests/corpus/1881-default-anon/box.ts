export class Base {
  tag(): string {
    return "base";
  }
}
// The one legal NAMELESS class declaration — extending a sibling export.
export default class extends Base {
  tag(): string {
    return "anon:" + super.tag();
  }
}
