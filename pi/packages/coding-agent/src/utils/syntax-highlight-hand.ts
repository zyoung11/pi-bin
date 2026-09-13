/**
 * Hand-written simplified grammars for languages whose upstream rangi forms
 * use custom matcher objects (nested template/comment scanning) that cannot
 * be expressed as plain rule records in the scriptc runtime. Rule behavior is
 * aligned with upstream where plain regex rules exist; the nested block-
 * comment matcher (kt/dart) and the fenced-code sub-language router (md) are
 * approximated.
 */

import {
	NO_SUB_RULES,
	type ShjLanguageDefinition,
	type ShjRule,
} from "./syntax-highlight.ts";

// shared: doc-comment reference tags (kt/dart `///` and `/**` doc blocks)
const docRules: ShjRule[] = [
	{ re: /\[[\w.<>$]+\]/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
	{ re: /\b(TODO|FIXME|BUG|XXX|HACK)\b/, flags: "", type: "err", sub: "", subRules: NO_SUB_RULES },
];

// shared: dart string interiors (escapes + `$name`/`${expr}` interpolation,
// the braced form re-tokenized as dart)
const dartEsc: ShjRule = {
	re: /\\(x[\da-fA-F]{1,4}|u[\da-fA-F]{4}|U[\da-fA-F]{8}|[^])/,
	flags: "",
	type: "esc",
	sub: "",
	subRules: NO_SUB_RULES,
};
const dartInterp: ShjRule = {
	re: /\$\{(?:[^{}'"\r\n]|'(?:\\[^]|[^'\r\n])*'|"(?:\\[^]|[^"\r\n])*"|\{[^{}]*\})*\}|\$\w+/,
	flags: "",
	type: "var",
	sub: "",
	subRules: [{ re: /(?<=^\$\{)[^]*(?=}$)/, flags: "", type: "", sub: "dart", subRules: NO_SUB_RULES }],
};

// shared: kotlin string interiors (escapes + `$name`/`${expr}` interpolation)
const ktInterpolation: ShjRule = {
	re: /\$\w+|\$\{([^{}]|\{[^{}]*\})*\}?/,
	flags: "",
	type: "var",
	sub: "",
	subRules: [{ re: /(?<=^\$\{)[^]*(?=}$)/, flags: "", type: "", sub: "kt", subRules: NO_SUB_RULES }],
};
const ktEscape: ShjRule = {
	re: /\\u[\da-fA-F]{4}|\\[^]/,
	flags: "",
	type: "esc",
	sub: "",
	subRules: NO_SUB_RULES,
};

export const LANG_MD: ShjLanguageDefinition = {
	rules: [
		{ re: /^ {0,3}(?:#{1,6}(?:[ \t]+.*)?|.+?\n {0,3}(?:=+|-+)[ \t]*)$/m, flags: "m", type: "section", sub: "", subRules: NO_SUB_RULES },
		{ re: /^>.*$/m, flags: "m", type: "cmnt", sub: "", subRules: NO_SUB_RULES },
		{ re: /\*\*.*?\*\*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		{ re: /^(`{3,})(.*)\n[^]*?^\1[ \t]*$/m, flags: "m", type: "", sub: "", subRules: NO_SUB_RULES },
		{ re: /`[^`]*`/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		{ re: /~~.*?~~/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		{ re: /\b_\S([^\n]*?\S)?_\b|\*\S([^\n]*?\S)?\*/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
		{ re: /^\s*(\*|\d+\.)\s/m, flags: "m", type: "kwd", sub: "", subRules: NO_SUB_RULES },
		{
			re: /\[[^\]]*]\([^)]*\)|<[^>]*>/,
			flags: "",
			type: "func",
			sub: "",
			subRules: [{ re: /^\[[^\]]*]/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES }],
		},
	],
	defaultType: "",
};

export const LANG_JS_TEMPLATE_LITERALS: ShjLanguageDefinition = {
	rules: [
		{
			re: /\$\{(?:[^{}]|\{[^{}]*\})*\}/,
			flags: "",
			type: "kwd",
			sub: "",
			subRules: [
				{ re: /(?!^\$|{)[^]+(?=}$)/, flags: "", type: "", sub: "js", subRules: NO_SUB_RULES },
			],
		},
	],
	defaultType: "str",
};

export const LANG_KT: ShjLanguageDefinition = {
	rules: [
		{ re: /\/\*\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "jsdoc", subRules: NO_SUB_RULES },
		{ re: /\/\/.*\n?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
		{ re: /\*[^]*?\*/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
		{ re: /"""[^]*?"""/, flags: "", type: "str", sub: "", subRules: [ktInterpolation] },
		{
			re: /"((?!")[^\r\n\\]|\\[^])*"?/,
			flags: "",
			type: "str",
			sub: "",
			subRules: [ktEscape, ktInterpolation],
		},
		{ re: /'(\\u[\da-fA-F]{0,4}|\\[^]|[^\r\n\\'])'/, flags: "", type: "str", sub: "", subRules: [ktEscape] },
		{ re: /(\.|\b)\d[\d_]*(\.\d[\d_]*)?(e[+-]?\d+)?\w*/i, flags: "i", type: "num", sub: "", subRules: NO_SUB_RULES },
		{ re: /@(\w+:)?[A-Z]\w*/, flags: "", type: "type", sub: "", subRules: NO_SUB_RULES },
		{ re: /\b(true|false|null)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
		{
			re: /(?<!\.)\b(abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|field|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|try|typealias|val|var|vararg|when|where|while)\b/,
			flags: "",
			type: "kwd",
			sub: "",
			subRules: NO_SUB_RULES,
		},
		{ re: /\b\w+@|@\w+\b/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		{ re: /\bit\b/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		{
			re: /[/*+:?&|%^~=!,<>.^-]+|\b(and|inv|or|shl|shr|ushr|xor|to|downTo|until|step)\b/,
			flags: "",
			type: "oper",
			sub: "",
			subRules: NO_SUB_RULES,
		},
		{ re: /[a-zA-Z_]\w*(?=\s*\()|[a-z_]\w*(?=\s*\{)/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
		{ re: /\b[A-Z]\w*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
	],
	defaultType: "",
};

export const LANG_DART: ShjLanguageDefinition = {
	rules: [
		{ re: /\/\/\/.*\n?/, flags: "", type: "cmnt", sub: "", subRules: docRules },
		{ re: /\/\/.*\n?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
		{ re: /\*\*(?:[^*]|\*[^/])*\*\//, flags: "", type: "cmnt", sub: "", subRules: docRules },
		{ re: /\*[^]*?\*/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
		{ re: /\br("""|''')(?:((?!\1)[^])*)\1?|\br(["'])((?!\3)[^\r\n])*\3?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		{ re: /("""|''')(?:\\[^]|(?!\1)[^])*\1?/, flags: "", type: "str", sub: "", subRules: [dartEsc, dartInterp] },
		{
			re: /(["'])(?:\\[^]|\$\{(?:[^{}'"\r\n]|'(?:\\[^]|[^'\r\n])*'|"(?:\\[^]|[^"\r\n])*"|\{[^{}]*\})*\}|\$\w+|(?!\1)[^\r\n\\])*\1?/,
			flags: "",
			type: "str",
			sub: "",
			subRules: [dartEsc, dartInterp],
		},
		{ re: /\b0[xX][\da-fA-F_]+|(\b\d[\d_]*(\.\d[\d_]*)?|\.\d[\d_]*)([eE][+-]?\d+)?/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
		{ re: /\b(true|false|null)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
		{ re: /\b(bool|double|int|num)\b/, flags: "", type: "type", sub: "", subRules: NO_SUB_RULES },
		{
			re: /(?<!\.)\b((async|sync|yield)\*|(abstract|as|assert|async|await|base|break|case|catch|class|const|continue|covariant|deferred|default|do|dynamic|else|enum|export|extends|extension|external|factory|final|finally|for|get|hide|if|implements|import|in|interface|is|late|library|mixin|new|on|operator|part|required|rethrow|return|sealed|set|show|static|super|switch|sync|this|throw|try|typedef|var|void|when|while|with|yield)\b)/,
			flags: "",
			type: "kwd",
			sub: "",
			subRules: NO_SUB_RULES,
		},
		{ re: /@\w+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		{ re: /[a-zA-Z_$][\w$]*(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
		{ re: /\b_?[A-Z][\w$]*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
	],
	defaultType: "",
};
