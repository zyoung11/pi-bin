// The as-const command-table idiom: literal-typed readonly records with primitive-constructor fields, empty as-const arrays (`aliases: []` — the readonly-[] shape), shared option consts spread into tables, and Pick-style width flows (tuple and empty-array fields lift into plain arrays).
export const yesOption = {
  name: "yes",
  shorthand: "y",
  type: Boolean,
  deprecated: false,
  description: "Accept default value for all prompts",
} as const;
export const projectOption = {
  name: "project",
  shorthand: null,
  type: String,
  argument: "NAME_OR_ID",
  deprecated: false,
  description: "Project name or ID",
} as const;
export const listSubcommand = {
  name: "list",
  aliases: ["ls"],
  description: "List all feature flags",
  default: true,
  arguments: [],
  options: [projectOption],
  examples: [],
} as const;
export const agentCommand = {
  name: "agent",
  aliases: [],
  description: "Generate an AGENTS.md file",
  arguments: [{ name: "init", required: false }],
  options: [{ ...yesOption, description: "Skip confirmation prompt" }],
  examples: [
    { name: "Generate", value: "mycli agent init" },
    { name: "Skip", value: "mycli agent init --yes" },
  ],
} as const;
console.log(agentCommand.name, agentCommand.aliases.length, agentCommand.arguments.length);
console.log(agentCommand.options[0].name, agentCommand.options[0].description);
console.log(listSubcommand.options[0].name, listSubcommand.options[0].type("linked"));
for (const ex of agentCommand.examples) {
  console.log(ex.name, "->", ex.value);
}
interface Pickish {
  name: string;
  aliases: readonly string[];
}
function getCommandAliases(command: Pickish): string[] {
  return [command.name].concat(command.aliases);
}
console.log(getCommandAliases(listSubcommand).join(","));
console.log(getCommandAliases(agentCommand).join(","));
const spec: Record<string, string> = {};
for (const option of agentCommand.options) {
  spec[`--${option.name}`] = option.shorthand ? `-${option.shorthand}` : "";
}
console.log(JSON.stringify(spec));
console.log(agentCommand.options[0].type === Boolean, projectOption.type === String);
