import { Item } from "./item.ts";
import { Group } from "./group.ts";

const g = new Item("alpha").crew(3);
console.log(g.label, g.count);
console.log(g.lead().name);
console.log(g.roster());
console.log(new Group("beta", 2).lead().crew(9).count);
