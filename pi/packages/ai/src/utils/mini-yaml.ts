/**
 * Minimal YAML subset parser covering document frontmatter: block mappings with 2-space
 * indentation, block and flow lists, quoted/plain scalars, booleans, numbers, null, inline
 * comments and literal (|) blocks. Anchors, aliases, tags, multi-document streams and merge
 * keys are not supported.
 */

type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

interface Line {
	indent: number;
	content: string;
}

function stripComment(text: string): string {
	let inSingle = false;
	let inDouble = false;
	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];
		if (char === "'" && !inDouble) {
			inSingle = !inSingle;
		} else if (char === '"' && !inSingle) {
			inDouble = !inDouble;
		} else if (
			char === "#" &&
			!inSingle &&
			!inDouble &&
			(index === 0 || text[index - 1] === " " || text[index - 1] === "\t")
		) {
			return text.slice(0, index);
		}
	}
	return text;
}

function toLines(text: string): Line[] {
	const out: Line[] = [];
	for (const raw of text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")) {
		if (raw.trim() === "" || raw.trim().startsWith("#")) continue;
		const trimmed = stripComment(raw).trimEnd();
		if (trimmed.trim() === "") continue;
		let indent = 0;
		while (indent < trimmed.length && trimmed[indent] === " ") indent += 1;
		out.push({ indent, content: trimmed.slice(indent) });
	}
	return out;
}

function parseScalar(raw: string): YamlValue {
	const text = raw.trim();
	if (text === "" || text === "~" || text === "null" || text === "Null" || text === "NULL") return null;
	if (text === "true" || text === "True" || text === "TRUE") return true;
	if (text === "false" || text === "False" || text === "FALSE") return false;
	if (text.startsWith("[") && text.endsWith("]")) {
		const inner = text.slice(1, -1).trim();
		if (inner === "") return [];
		const items: YamlValue[] = [];
		let depth = 0;
		let current = "";
		let inSingle = false;
		let inDouble = false;
		for (const char of inner) {
			if (char === "'" && !inDouble) inSingle = !inSingle;
			else if (char === '"' && !inSingle) inDouble = !inDouble;
			else if ((char === "," || char === "[") && !inSingle && !inDouble) {
				if (char === "[") depth += 1;
				if (char === "," && depth === 0) {
					items.push(parseScalar(current));
					current = "";
					continue;
				}
			} else if (char === "]" && !inSingle && !inDouble) {
				depth -= 1;
			}
			current += char;
		}
		if (current.trim() !== "") items.push(parseScalar(current));
		return items;
	}
	if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
		return text.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
	}
	if (text.startsWith("'") && text.endsWith("'") && text.length >= 2) {
		return text.slice(1, -1).replace(/''/g, "'");
	}
	const asNumber = Number(text);
	if (text !== "" && !Number.isNaN(asNumber)) return asNumber;
	return text;
}

function splitKey(content: string): [string, string] | null {
	let inSingle = false;
	let inDouble = false;
	for (let index = 0; index < content.length; index += 1) {
		const char = content[index];
		if (char === "'" && !inDouble) inSingle = !inSingle;
		else if (char === '"' && !inSingle) inDouble = !inDouble;
		else if (char === ":" && !inSingle && !inDouble) {
			const after = content[index + 1];
			if (after === undefined || after === " " || after === "\t") {
				return [content.slice(0, index), content.slice(index + 1)];
			}
		}
	}
	return null;
}

function parseBlock(lines: Line[], start: number, indent: number): [number, YamlValue] {
	if (start >= lines.length) return [start, null];
	const first = lines[start];
	if (first.indent < indent) return [start, null];
	if (first.content.startsWith("- ") || first.content === "-") {
		const items: YamlValue[] = [];
		let index = start;
		while (
			index < lines.length &&
			lines[index].indent === first.indent &&
			(lines[index].content.startsWith("- ") || lines[index].content === "-")
		) {
			const line = lines[index];
			const rest = line.content === "-" ? "" : line.content.slice(2);
			if (rest === "") {
				const [next, nested] = parseBlock(lines, index + 1, line.indent + 1);
				items.push(nested);
				index = next;
			} else {
				const itemKeyValue = splitKey(rest);
				if (itemKeyValue) {
					const map: { [key: string]: YamlValue } = {};
					const base = index + 1 < lines.length ? lines[index + 1].indent : line.indent + 1;
					const inner: Line[] = [{ indent: line.indent + 1, content: rest }];
					let j = index + 1;
					while (j < lines.length && lines[j].indent > line.indent) {
						inner.push({ indent: line.indent + 1 + (lines[j].indent - base), content: lines[j].content });
						j += 1;
					}
					parseMapInto(map, inner, 0, line.indent + 1);
					items.push(map);
					index = j;
					continue;
				}
				items.push(parseScalar(rest));
				index += 1;
			}
		}
		return [index, items];
	}
	const map: { [key: string]: YamlValue } = {};
	const next = parseMapInto(map, lines, start, first.indent);
	return [next, map];
}

function parseMapInto(map: { [key: string]: YamlValue }, lines: Line[], start: number, indent: number): number {
	let index = start;
	while (index < lines.length && lines[index].indent >= indent) {
		const line = lines[index];
		if (line.indent > indent) {
			index += 1;
			continue;
		}
		if (line.content.startsWith("- ")) {
			index += 1;
			continue;
		}
		const keyValue = splitKey(line.content);
		if (!keyValue) {
			index += 1;
			continue;
		}
		const key = keyValue[0].trim().replace(/^["']|["']$/g, "");
		const rest = keyValue[1].trim();
		if (rest === "|" || rest === "|-" || rest === ">") {
			const blockLines: string[] = [];
			let j = index + 1;
			while (j < lines.length && lines[j].indent > line.indent) {
				blockLines.push(lines[j].content);
				j += 1;
			}
			map[key] = blockLines.join(rest.startsWith(">") ? " " : "\n") + (rest === "|" || rest === ">" ? "\n" : "");
			index = j;
			continue;
		}
		if (rest === "") {
			const childIndent = index + 1 < lines.length ? lines[index + 1].indent : -1;
			if (childIndent > line.indent) {
				const [next, nested] = parseBlock(lines, index + 1, childIndent);
				map[key] = nested;
				index = next;
				continue;
			}
			map[key] = null;
			index += 1;
			continue;
		}
		map[key] = parseScalar(rest);
		index += 1;
	}
	return index;
}

export function parse(text: string): YamlValue | undefined {
	const lines = toLines(text);
	if (lines.length === 0) return null;
	const [, value] = parseBlock(lines, 0, lines[0].indent);
	return value;
}

export default { parse };
