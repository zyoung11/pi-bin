/**
 * Minimal partial-JSON parser: parses potentially incomplete JSON text by completing open
 * strings, arrays and objects. Covers the streaming tool-call use case; duplicate keys,
 * comments and trailing garbage beyond the first completed value are not supported.
 */

function completionForTail(tail: string): string | undefined {
	if (tail === "t" || tail === "tr" || tail === "tru") return "true";
	if (tail === "f" || tail === "fa" || tail === "fal" || tail === "fals") return "false";
	if (tail === "n" || tail === "nu" || tail === "nul") return "null";
	if (tail === "N" || tail === "Na" || tail === "Nan") return "NaN";
	return undefined;
}

function closeOpenStructures(text: string): string | undefined {
	const stack: string[] = [];
	let inString = false;
	let escaped = false;
	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];
		if (inString) {
			if (escaped) {
				escaped = false;
			} else if (char === "\\") {
				escaped = true;
			} else if (char === '"') {
				inString = false;
			}
			continue;
		}
		if (char === '"') {
			inString = true;
		} else if (char === "{" || char === "[") {
			stack.push(char);
		} else if (char === "}" || char === "]") {
			if (stack.length === 0) return undefined;
			stack.pop();
		}
	}
	if (escaped) return undefined;
	let out = text.replace(/\s+$/, "");
	if (inString) out += '"';
	out = out.replace(/,\s*$/, "");
	const tailMatch = /[A-Za-z_]+$/.exec(out);
	if (tailMatch) {
		const tail = tailMatch[0];
		const prevChar = out.length > tail.length ? out[out.length - tail.length - 1] : "";
		if ("[{,: \t".includes(prevChar)) {
			const full = completionForTail(tail);
			if (full !== undefined) out = out.slice(0, out.length - tail.length) + full;
		}
	}
	if (out.endsWith(":")) {
		const withoutKey = out.replace(/,?\s*"[^"]*"\s*:\s*$/, "");
		if (withoutKey !== out) out = withoutKey.replace(/,\s*$/, "");
		else out += " null";
	}
	for (let index = stack.length - 1; index >= 0; index -= 1) {
		out += stack[index] === "{" ? "}" : "]";
	}
	return out;
}

export function parse(text: string): unknown {
	const attempt = closeOpenStructures(text);
	if (attempt !== undefined) {
		try {
			return JSON.parse(attempt);
		} catch {
			// fall through to the truncation loop
		}
	}
	let candidate = text;
	for (let cut = 0; cut < 256 && candidate.length > 0; cut += 1) {
		const completed = closeOpenStructures(candidate);
		if (completed !== undefined) {
			try {
				return JSON.parse(completed);
			} catch {
				// keep truncating
			}
		}
		candidate = candidate.slice(0, -1);
	}
	return undefined;
}
