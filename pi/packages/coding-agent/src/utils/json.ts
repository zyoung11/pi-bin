/** Strip `//` line comments and trailing commas from JSON, leaving string literals untouched. */
export function stripJsonComments(input: string): string {
	let out = "";
	let inString = false;
	let i = 0;
	while (i < input.length) {
		const ch = input.charAt(i);
		if (inString) {
			out += ch;
			if (ch === "\\" && i + 1 < input.length) {
				out += input.charAt(i + 1);
				i += 2;
				continue;
			}
			if (ch === '"') inString = false;
			i++;
			continue;
		}
		if (ch === '"') {
			inString = true;
			out += ch;
			i++;
			continue;
		}
		if (ch === "/" && input.charAt(i + 1) === "/") {
			while (i < input.length && input.charAt(i) !== "\n") i++;
			continue;
		}
		if (ch === ",") {
			let j = i + 1;
			while (
				j < input.length &&
				(input.charAt(j) === " " ||
					input.charAt(j) === "\t" ||
					input.charAt(j) === "\n" ||
					input.charAt(j) === "\r")
			) {
				j++;
			}
			const next = input.charAt(j);
			if (next === "}" || next === "]") {
				i = j;
				continue;
			}
		}
		out += ch;
		i++;
	}
	return out;
}
