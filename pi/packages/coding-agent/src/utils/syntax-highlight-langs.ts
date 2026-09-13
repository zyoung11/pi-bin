/**
 * Syntax-highlight grammars, generated from rangi v2.2.0 grammar sources
 * (MIT, https://github.com/pi0/rangi) by a one-time conversion script.
 *
 * The grammars md/dart/kt/js_template_literals are registered from
 * syntax-highlight-hand.ts (hand-written simplified variants — their
 * upstream forms use custom matcher objects); vue/astro/svelte are not
 * ported. Do not edit the generated blocks by hand.
 *
 * `[^]` is the JavaScript any-character class and is intentional in every
 * grammar below.
 */

/* biome-ignore-all lint/correctness/noEmptyCharacterClassInRegex: JS any-char idiom from the rangi grammars */

import { NO_SUB_RULES, type ShjLanguageDefinition } from "./syntax-highlight.ts";
import {
	LANG_DART,
	LANG_JS_TEMPLATE_LITERALS,
	LANG_KT,
	LANG_MD,
} from "./syntax-highlight-hand.ts";

const LANG_ASM: ShjLanguageDefinition = {
	rules: [
			{ re: /(;|#).*/m, flags: "m", type: "cmnt", sub: "", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$[\da-fA-F]*\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /^[a-z]+\s+[a-z.]+\b/m, flags: "m", type: "kwd", sub: "", subRules: [
			{ re: /^[a-z]+/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /^[ \t]*[a-z][a-z\d]*\b/m, flags: "m", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /%|\$/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_BASH: ShjLanguageDefinition = {
	rules: [
			{ re: /#.*/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])((?!\1)[^\r\n\\]|\\[^])*\1?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\$\w+|\${[^}]*}|\$\([^)]*\)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /(?<=\s|^)\.*\/[a-z/_.-]+/i, flags: "i", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\s-[a-zA-Z]+|$<|[&|;]+|\b(unset|readonly|shift|export|if|fi|else|elif|while|do|done|for|until|case|esac|break|continue|exit|return|trap|wait|eval|exec|then|declare|enable|local|select|typeset|time|add|remove|install|update|delete)(?=\s|$)/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=(^|\||&&|;)\s*)[a-z_.-]+(?=\s|$)/im, flags: "im", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\s|^)(true|false)(?=\s|$)/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[=<>!]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\s|^)[\w_]+(?=\s*=)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$\w+|\${[^}]*}|\$\([^)]*\)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_C: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /#\s*include (<.*>|".*")/, flags: "", type: "kwd", sub: "", subRules: [
			{ re: /(<|").*/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /asm\s*{[^}]*}/, flags: "", type: "", sub: "", subRules: [
			{ re: /^asm/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /[^{}]*(?=}$)/, flags: "", type: "", sub: "asm", subRules: NO_SUB_RULES },
		] },
			{ re: /\*|&|#[a-z]+\b|\b(asm|auto|double|int|struct|break|else|long|switch|case|enum|register|typedef|char|extern|return|union|const|float|short|unsigned|continue|for|signed|void|default|goto|sizeof|volatile|do|if|static|while)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z_][\w_]*(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z][\w_]*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_CPP: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /\b(?:u8|[uUL])?R"([^\s()\\]{0,16})\(([^]*?)\)\1"/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(?:u8|[uUL])(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.|\b)\d[\d.']*(e[+-]?\d+)?\w*/i, flags: "i", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /#\s*include (<.*>|".*")/, flags: "", type: "kwd", sub: "", subRules: [
			{ re: /(<|").*/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\b(true|false|nullptr)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /#[a-z]+\b|\b(alignas|alignof|and|and_eq|asm|auto|bitand|bitor|bool|break|case|catch|char|char8_t|char16_t|char32_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|not|not_eq|operator|or|or_eq|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|xor|xor_eq)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z_][\w_]*(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z][\w_]*\b|\b[a-z_]\w*(?=::)/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_CS: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\/\/.*\n?/, flags: "", type: "cmnt", sub: "", subRules: [
			{ re: /(?<=<\/?)[\w.-]+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /"[^"\r\n]*"/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /\$*"""[^]*?"""/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\$@|@\$)"([^"]|"")*"?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\{[^{}"\r\n]*}/, flags: "", type: "", sub: "", subRules: [
			{ re: /^\{|}$/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /[^{}:]+/, flags: "", type: "", sub: "cs", subRules: NO_SUB_RULES },
			{ re: /:[^{}]*/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		] },
		] },
			{ re: /@"([^"]|"")*"?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$"((?!")[^\r\n\\]|\\[^])*"?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\{[^{}"\r\n]*}/, flags: "", type: "", sub: "", subRules: [
			{ re: /^\{|}$/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /[^{}:]+/, flags: "", type: "", sub: "cs", subRules: NO_SUB_RULES },
			{ re: /:[^{}]*/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\\(x[\da-fA-F]{1,4}|u[\da-fA-F]{4}|U[\da-fA-F]{8}|[^])/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\\(x[\da-fA-F]{1,4}|u[\da-fA-F]{4}|U[\da-fA-F]{8}|[^])/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\b0[xb][\da-f_]+[ul]*|(\b\d|\.\d)[\d_]*(\.\d[\d_]*)?(e[+-]?\d+)?[dflmu]*\b/i, flags: "i", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /^[ \t]*#[^\r\n]*/m, flags: "m", type: "", sub: "", subRules: [
			{ re: /#\s*\w+/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /(?<=(^[ \t]*|[(,]\s*)\[\s*)@?[\w.]+/m, flags: "m", type: "type", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false|null)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /\bfile(?=\s+(class|record|struct|interface|enum|delegate))|\b(abstract|add|alias|and|as|ascending|async|await|base|bool|break|by|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|descending|do|double|dynamic|else|enum|equals|event|explicit|extern|finally|fixed|float|for|foreach|from|get|global|goto|group|if|implicit|in|init|int|interface|internal|into|is|join|let|lock|long|nameof|namespace|new|nint|not|notnull|nuint|object|on|operator|or|orderby|out|override|params|partial|private|protected|public|readonly|record|ref|remove|required|return|sbyte|scoped|sealed|select|set|short|sizeof|stackalloc|static|string|struct|switch|this|throw|try|typeof|uint|ulong|unchecked|unmanaged|unsafe|ushort|using|value|var|virtual|void|volatile|when|where|while|with|yield)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z_]\w*(?=\s*(<[\w\s,.?[\]]*>\s*)?\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z]\w*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_CSS: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /@\w+\b|\b(and|not|only|or)\b|\b(?=([a-z-]+))\2(?=[^{}]*{)/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[\w-]+(?=\s*:)|(::?|\.)[\w-]+(?=[^{}]*{)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /#[\w-]+(?=[^{}]*{)/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /#[\da-f]{3,8}/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\d+(\.\d+)?(cm|mm|in|px|pt|pc|em|ex|ch|rem|vm|vh|vmin|vmax|%)?/, flags: "", type: "num", sub: "", subRules: [
			{ re: /[a-z]+|%/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /url\([^)]*\)/, flags: "", type: "", sub: "", subRules: [
			{ re: /url(?=\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[^()]+/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\b[a-zA-Z]\w*(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[a-z-]+\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_CSV: ShjLanguageDefinition = {
	rules: [
			{ re: /"((?!")[^\r\n\\]|\\[^])*"?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /,/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_DIFF: ShjLanguageDefinition = {
	rules: [
			{ re: /^[-<].*/m, flags: "m", type: "deleted", sub: "", subRules: NO_SUB_RULES },
			{ re: /^[+>].*/m, flags: "m", type: "insert", sub: "", subRules: NO_SUB_RULES },
			{ re: /!.*/m, flags: "m", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /^@@.*@@$|^\d.*|^([*-+])\1\1.*/m, flags: "m", type: "section", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_DOCKER: ShjLanguageDefinition = {
	rules: [
			{ re: /^(FROM|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/im, flags: "im", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /#.*/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])((?!\1)[^\r\n\\]|\\[^])*\1?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\$\w+|\${[^}]*}|\$\([^)]*\)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /(?<=\s|^)\.*\/[a-z/_.-]+/i, flags: "i", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\s-[a-zA-Z]+|$<|[&|;]+|\b(unset|readonly|shift|export|if|fi|else|elif|while|do|done|for|until|case|esac|break|continue|exit|return|trap|wait|eval|exec|then|declare|enable|local|select|typeset|time|add|remove|install|update|delete)(?=\s|$)/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=(^|\||&&|;)\s*)[a-z_.-]+(?=\s|$)/im, flags: "im", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\s|^)(true|false)(?=\s|$)/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[=<>!]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\s|^)[\w_]+(?=\s*=)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$\w+|\${[^}]*}|\$\([^)]*\)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_GO: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /`[^`]*`?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\*|&|\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z_][\w_]*(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z][\w_]*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[+\-*/%&|^~=!<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_GRAPHQL: ShjLanguageDefinition = {
	rules: [
			{ re: /#.*/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /"""(\\"""|(?!""")[^])*(""")?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /"((?!")[^\r\n\\]|\\[^])*"?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false|null)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(query|mutation|subscription|fragment|on|type|input|interface|union|enum|scalar|schema|directive|extend|implements|repeatable)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /@\w+/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z]\w*/, flags: "", type: "type", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$?\w+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /\.{3}|[!=|&:-]/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_HTML: ShjLanguageDefinition = {
	rules: [
			{ re: /<!DOCTYPE("[^"]*"|'[^']*'|[^"'>])*>/i, flags: "i", type: "class", sub: "", subRules: [
			{ re: /"[^"]*"|'[^']*'/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /^<!|>$/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /DOCTYPE/i, flags: "i", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /<style(\s+[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*\s*(=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\4)[^])*\4?)?)?)*\s*>[^]*?<\/style\s*>/, flags: "", type: "", sub: "", subRules: [
			{ re: /^<style(\s+[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*\s*(=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\4)[^])*\4?)?)?)*\s*>/, flags: "", type: "", sub: "", subRules: [
			{ re: /^<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "var", sub: "", subRules: [
			{ re: /^<[/!?]?/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\2)[^])*\2?)/, flags: "", type: "str", sub: "", subRules: [
			{ re: /^=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /[/!?]?>/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\/<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*(\s+[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*\s*(=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\4)[^])*\4?)?)?)*\s*[/!?]?>\/g|[^]*(?=<\/style\s*>$)/, flags: "", type: "", sub: "css", subRules: NO_SUB_RULES },
			{ re: /<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*(\s+[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*\s*(=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\4)[^])*\4?)?)?)*\s*[/!?]?>/, flags: "", type: "", sub: "", subRules: [
			{ re: /^<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "var", sub: "", subRules: [
			{ re: /^<[/!?]?/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\2)[^])*\2?)/, flags: "", type: "str", sub: "", subRules: [
			{ re: /^=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /[/!?]?>/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		] },
		] },
			{ re: /<script(\s+[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*\s*(=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\4)[^])*\4?)?)?)*\s*>[^]*?<\/script\s*>/, flags: "", type: "", sub: "", subRules: [
			{ re: /^<script(\s+[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*\s*(=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\4)[^])*\4?)?)?)*\s*>/, flags: "", type: "", sub: "", subRules: [
			{ re: /^<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "var", sub: "", subRules: [
			{ re: /^<[/!?]?/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\2)[^])*\2?)/, flags: "", type: "str", sub: "", subRules: [
			{ re: /^=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /[/!?]?>/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\/<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*(\s+[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*\s*(=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\4)[^])*\4?)?)?)*\s*[/!?]?>\/g|[^]*(?=<\/script\s*>$)/, flags: "", type: "", sub: "js", subRules: NO_SUB_RULES },
			{ re: /<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*(\s+[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*\s*(=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\4)[^])*\4?)?)?)*\s*[/!?]?>/, flags: "", type: "", sub: "", subRules: [
			{ re: /^<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "var", sub: "", subRules: [
			{ re: /^<[/!?]?/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\2)[^])*\2?)/, flags: "", type: "str", sub: "", subRules: [
			{ re: /^=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /[/!?]?>/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		] },
		] },
			{ re: /<!--[^]*?-->/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /<!\[CDATA\[[\s\S]*?\]\]>/i, flags: "i", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*(\s+[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*\s*(=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\4)[^])*\4?)?)?)*\s*[/!?]?>/, flags: "", type: "", sub: "", subRules: [
			{ re: /^<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "var", sub: "", subRules: [
			{ re: /^<[/!?]?/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\2)[^])*\2?)/, flags: "", type: "str", sub: "", subRules: [
			{ re: /^=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /[/!?]?>/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /<\?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*([^?]|\?[^?>])*\?+>/, flags: "", type: "str", sub: "", subRules: [
			{ re: /^<\?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "var", sub: "", subRules: [
			{ re: /^<\?/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\?+>$/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /&(#x?)?[\da-z]{1,8};/i, flags: "i", type: "var", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_HTTP: ShjLanguageDefinition = {
	rules: [
			{ re: /^(GET|HEAD|POST|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH|PRI|SEARCH)\b/m, flags: "m", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /\bHTTP\/[\d.]+\b/, flags: "", type: "section", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[,;:=]/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z][\w-]*(?=:)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /\n\n[^]*/, flags: "", type: "", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_INI: ShjLanguageDefinition = {
	rules: [
			{ re: /(^[ \f\t\v]*)[#;].*/m, flags: "m", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /.*(?==)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /^\s*\[.+\]\s*$/m, flags: "m", type: "section", sub: "", subRules: NO_SUB_RULES },
			{ re: /=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /.*/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_JAVA: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(abstract|assert|boolean|break|byte|case|catch|char|class|continue|const|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|package|private|protected|public|requires|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|var|void|volatile|while)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z_][\w_]*(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z][\w_]*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_JS: ShjLanguageDefinition = {
	rules: [
			{ re: /(?<=[{,]\s*)(("|')((?!\2)[^\r\n\\]|\\[^])*\2|[a-zA-Z]\w*)(?=\s*:)/, flags: "", type: "", sub: "", subRules: NO_SUB_RULES },
			{ re: /\/\*\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "jsdoc", subRules: NO_SUB_RULES },
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /`((?!`)[^]|\\[^])*`?/, flags: "", type: "", sub: "js_template_literals", subRules: NO_SUB_RULES },
			{ re: /=>|\b(this|set|get|as|async|await|break|case|catch|class|const|constructor|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|let|var|of|new|package|private|protected|public|return|static|super|switch|throw|throws|try|typeof|void|while|with|yield)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\/((?!\/)[^\r\n\\]|\\.)+\/[dgimsuy]*/, flags: "", type: "", sub: "regex", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(NaN|null|undefined|[A-Z][A-Z_]*)\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z][\w_]*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z$_][\w$_]*(?=\s*((\?\.)?\s*\(|=\s*(\(?[\w,{}[\])]+\)? =>|function\b)))/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_JSDOC: ShjLanguageDefinition = {
	rules: [
			{ re: /@\w+/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /{[\w\s|<>,.@[\]]+}/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /\[[\w\s="']+\]/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(TODO|FIXME|DEBUG|OPTIMIZE|WARNING|XXX|BUG)\b/, flags: "", type: "err", sub: "", subRules: NO_SUB_RULES },
			{ re: /\bIDEA\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(CHANGED|FIX|CHANGE)\b/, flags: "", type: "insert", sub: "", subRules: NO_SUB_RULES },
			{ re: /\bQUESTION\b/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "cmnt",
};

const LANG_JSON: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(("|')((?!\2)[^\r\n\\]|\\[^])*\2|[a-zA-Z]\w*)(?=\s*:)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(null|NaN|Infinity)\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_JSX: ShjLanguageDefinition = {
	rules: [
			{ re: /(?<![$\w])<([:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*)(?:\s+[$\w{}.:-]+(?:\s*=\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|"[^"]*"?|'[^']*'?|[^"'>\s][^>\s]*))?)*\s*>[^]*?<\/\1\s*>|<>[^]*?<\/>|(?<![$\w])<[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*(?:\s+[$\w{}.:-]+(?:\s*=\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|"[^"]*"?|'[^']*'?|[^"'>\s][^>\s]*))?)*\s*\/?>|<\/(?:[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*)?\s*>/, flags: "", type: "", sub: "", subRules: [
			{ re: /<[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*(?:\s+[$\w{}.:-]+(?:\s*=\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|"[^"]*"?|'[^']*'?|[^"'>\s][^>\s]*))?)*\s*\/?>|<\/(?:[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*)?\s*>|<>/, flags: "", type: "", sub: "", subRules: [
			{ re: /^<\/?(?:[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*)?/, flags: "", type: "var", sub: "", subRules: [
			{ re: /^<\/?/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /=\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/, flags: "", type: "bracket", sub: "", subRules: [
			{ re: /^=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=^=\{)[^]+(?=\}$)/, flags: "", type: "", sub: "jsx", subRules: NO_SUB_RULES },
		] },
			{ re: /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/, flags: "", type: "bracket", sub: "", subRules: [
			{ re: /(?<=^\{)[^]+(?=\}$)/, flags: "", type: "", sub: "jsx", subRules: NO_SUB_RULES },
		] },
			{ re: /=\s*(?:"[^"]*"?|'[^']*'?|[^"'>\s][^>\s]*)/, flags: "", type: "str", sub: "", subRules: [
			{ re: /^=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\/?>/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/, flags: "", type: "bracket", sub: "", subRules: [
			{ re: /(?<=^\{)[^]+(?=\}$)/, flags: "", type: "", sub: "jsx", subRules: NO_SUB_RULES },
		] },
			{ re: /&(#x?)?[\da-z]{1,8};/i, flags: "i", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /(?<=[{,]\s*)(("|')((?!\2)[^\r\n\\]|\\[^])*\2|[a-zA-Z]\w*)(?=\s*:)/, flags: "", type: "", sub: "", subRules: NO_SUB_RULES },
			{ re: /\/\*\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "jsdoc", subRules: NO_SUB_RULES },
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /`((?!`)[^]|\\[^])*`?/, flags: "", type: "", sub: "js_template_literals", subRules: NO_SUB_RULES },
			{ re: /=>|\b(this|set|get|as|async|await|break|case|catch|class|const|constructor|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|let|var|of|new|package|private|protected|public|return|static|super|switch|throw|throws|try|typeof|void|while|with|yield)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\/((?!\/)[^\r\n\\]|\\.)+\/[dgimsuy]*/, flags: "", type: "", sub: "regex", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(NaN|null|undefined|[A-Z][A-Z_]*)\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z][\w_]*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z$_][\w$_]*(?=\s*((\?\.)?\s*\(|=\s*(\(?[\w,{}[\])]+\)? =>|function\b)))/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_LESS: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /@\{[^{}]*\}?/, flags: "", type: "oper", sub: "", subRules: [
			{ re: /[\w-]+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
		] },
			{ re: /`[^`]*`?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /url\([^)]*\)/, flags: "", type: "", sub: "", subRules: [
			{ re: /url(?=\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[^()]+/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /@\{[^{}]*\}?/, flags: "", type: "oper", sub: "", subRules: [
			{ re: /[\w-]+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /@(media|import|charset|namespace|supports|keyframes|font-face|page|plugin|layer|container|property|counter-style|-[\w-]+)(?![\w-]|\s*:)|![\w-]+|(?<![\w-])(and|not|only|or|when|reference|inline|once|multiple|optional)(?![\w-])/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false|null)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[$@]@?[\w-]+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /[.%]-?[a-zA-Z_][\w-]*(?![\w(-])|&[\w-]*|::?[a-zA-Z][\w-]*(?=[^{};]*(?<![#@])\{)/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /#[\w-]+(?=[^{};]*(?<![#@])\{)|(?<![$@!=:([]\s*)\b[a-z][\w-]*(?=[^{};]*(?<![#@])\{)/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /--[\w-]+|[\w-]+(?=([#@]\{[^{}]*\})*\s*[:=])/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /#[\da-fA-F]{3,8}\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[.#][\w-]+(?=\s*\()|#[\w-]+(?=\s*>)/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.\d+|\d+(\.\d+)?)(cm|mm|in|px|pt|pc|em|ex|ch|rem|vmin|vmax|vw|vh|deg|rad|turn|ms|s|fr|%)?/, flags: "", type: "num", sub: "", subRules: [
			{ re: /[a-z]+|%/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /[\w-]+(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[!<>=+*/~%-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[a-z-]+\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_LOG: ShjLanguageDefinition = {
	rules: [
			{ re: /^#.*/m, flags: "m", type: "cmnt", sub: "", subRules: NO_SUB_RULES },
			{ re: /"((?!")[^\r\n\\]|\\[^])*"?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(err(or)?|[a-z_-]*exception|warn|warning|failed|ko|invalid|not ?found|alert|fatal)\b/i, flags: "i", type: "err", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(null|undefined)\b/i, flags: "i", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(false|true|yes|no)\b/i, flags: "i", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /\.|,/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_LUA: ShjLanguageDefinition = {
	rules: [
			{ re: /^#!.*|--(\[(=*)\[[^]*?\]\2\]|.*)/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(and|break|do|else|elseif|end|for|function|if|in|local|not|or|repeat|return|then|until|while)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false|nil)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[+*/%^#=~<>:,.-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-z_]+(?=\s*[({])/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_MAKE: ShjLanguageDefinition = {
	rules: [
			{ re: /^\s*#.*/m, flags: "m", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /[${}()]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /.PHONY:/m, flags: "m", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /^[\w.]+:/m, flags: "m", type: "section", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(ifneq|endif)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[A-Z_]+(?=\s*=)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /^.*$/m, flags: "m", type: "", sub: "bash", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_PHP: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\*\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "jsdoc", subRules: NO_SUB_RULES },
			{ re: /\/\/.*\n?|#(?!\[).*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /<\?(php\b|=)?|\?>/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /^(?!<\?)[^]+?(?=<\?|$)|(?<=\?>)[^]+?(?=<\?|$)/, flags: "", type: "", sub: "html", subRules: NO_SUB_RULES },
			{ re: /<<<'(\w+)'[^]*?\n[ \t]*\1\b/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /<<<("?)(\w+)\1[^]*?\n[ \t]*\2\b/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\\(u\{[\da-f]+\}|x[\da-f]{1,2}|[0-7]{1,3}|[^])/i, flags: "i", type: "esc", sub: "", subRules: NO_SUB_RULES },
			{ re: /\{\$[^{}\r\n]*\}|\$\{[^}\r\n]*\}|\$+\w+(\[[^\]\r\n]*\]|->\w+)?/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /'((?!')[^\\]|\\[^])*'?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /"((?!")[^\\]|\\[^])*"?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\\(u\{[\da-f]+\}|x[\da-f]{1,2}|[0-7]{1,3}|[^])/i, flags: "i", type: "esc", sub: "", subRules: NO_SUB_RULES },
			{ re: /\{\$[^{}\r\n]*\}|\$\{[^}\r\n]*\}|\$+\w+(\[[^\]\r\n]*\]|->\w+)?/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /`((?!`)[^\\]|\\[^])*`?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\\(u\{[\da-f]+\}|x[\da-f]{1,2}|[0-7]{1,3}|[^])/i, flags: "i", type: "esc", sub: "", subRules: NO_SUB_RULES },
			{ re: /\{\$[^{}\r\n]*\}|\$\{[^}\r\n]*\}|\$+\w+(\[[^\]\r\n]*\]|->\w+)?/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /#\[/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b0[box][\da-f_]+|(\b\d[\d_]*\.?[\d_]*|\B\.\d[\d_]*)(e[+-]?\d+)?/i, flags: "i", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$+\w+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=(->|::)\s*)\w+(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=->\s*)\w+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=[(,]\s*)[a-z_]\w*(?=\s*:(?!:))/i, flags: "i", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false|null)\b/i, flags: "i", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\(\s*)(array|binary|bool|boolean|double|float|int|integer|object|real|string|unset)(?=\s*\))/i, flags: "i", type: "type", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\byield\s+)from\b|\b(__CLASS__|__DIR__|__FILE__|__FUNCTION__|__LINE__|__METHOD__|__NAMESPACE__|__TRAIT__|__halt_compiler|abstract|and|array|as|break|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|new|or|parent|print|private|protected|public|readonly|require|require_once|return|self|static|switch|throw|trait|try|unset|use|var|while|xor|yield)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(bool|callable|float|int|iterable|mixed|never|object|string|void)\b/, flags: "", type: "type", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\b(?:class|enum|extends|implements|instanceof|interface|new|trait)\s+|#\[\s*)\\?\w+(\\\w+)*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z_]\w*(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z]\w*\b|\b[a-z_]\w*(?=\s*::)/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[!%&*+,.:<=>?^|~/\\-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_PL: ShjLanguageDefinition = {
	rules: [
			{ re: /#.*/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(any|break|continue|default|delete|die|do|else|elsif|eval|for|foreach|given|goto|if|last|local|my|next|our|package|print|redo|require|return|say|state|sub|switch|undef|unless|until|use|when|while|not|and|or|xor)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /[-+*/%~!&<>|=?,]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-z_]+(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_PLAIN: ShjLanguageDefinition = {
	rules: [
			{ re: /"((?!")[^\r\n\\]|\\[^])*"?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_PS1: ShjLanguageDefinition = {
	rules: [
			{ re: /<#[^]*?(?:#>|$)/, flags: "", type: "cmnt", sub: "", subRules: [
			{ re: /(?<=^[ \t]*\.)[a-z]+\b/im, flags: "im", type: "kwd", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /#.*/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /@"[^]*?^"@/m, flags: "m", type: "str", sub: "", subRules: [
			{ re: /`[^]/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$\((?:[^()]|\([^()]*\))*\)|\$(?:\{[^}]*\}|[\w:]+|[$?^])|@\w+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /@'[^]*?^'@/m, flags: "m", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /"(?:`[^]|[^"`])*"?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /`[^]/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$\((?:[^()]|\([^()]*\))*\)|\$(?:\{[^}]*\}|[\w:]+|[$?^])|@\w+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /'(?:[^']|'')*'?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$(?:true|false|null)\b/i, flags: "i", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$\((?:[^()]|\([^()]*\))*\)|\$(?:\{[^}]*\}|[\w:]+|[$?^])|@\w+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /\[[a-z_][\w.]*(?:\[\])?\]/i, flags: "i", type: "type", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[a-z]+-[a-z]\w*/i, flags: "i", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(?:begin|break|catch|class|continue|data|default|do|dynamicparam|else|elseif|end|enum|exit|filter|finally|foreach|for|from|function|hidden|if|inlinescript|in|parallel|param|process|return|sequence|static|switch|throw|trap|try|until|using|while|workflow)\b/i, flags: "i", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\b(?:class|enum)\s+)\w+/i, flags: "i", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /-(?:eq|ne|ge|gt|le|lt|notlike|like|notmatch|match|notcontains|contains|notin|in|isnot|is|as|and|or|xor|not|band|bor|bxor|bnot|shl|shr|replace|split|join|f)\b/i, flags: "i", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\s|^)--?[a-z]\w*/im, flags: "im", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b0x[\da-f]+\b|(?:\.\d|\b\d)\d*(?:\.\d+)?(?:e[+-]?\d+)?(?:kb|mb|gb|tb|pb)?\b/i, flags: "i", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-z_]\w*(?=\s*\()/i, flags: "i", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /::|[-=+*/%!<>|&,;.@]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_PY: ShjLanguageDefinition = {
	rules: [
			{ re: /#.*/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /f("""|''')(\\[^]|(?!\1)[^])*\1?|f("|')(\\[^]|(?!\3).)*\3?/i, flags: "i", type: "str", sub: "", subRules: [
			{ re: /{[^{}]*}/, flags: "", type: "var", sub: "", subRules: [
			{ re: /(?!^{)[^]*(?=}$)/, flags: "", type: "", sub: "py", subRules: NO_SUB_RULES },
		] },
		] },
			{ re: /("""|''')(\\[^]|(?!\1)[^])*\1?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(False|True|None)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-z_]\w*(?=\s*\()/i, flags: "i", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[-/*+<>,=!&|^%]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z][\w_]*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_RB: ShjLanguageDefinition = {
	rules: [
			{ re: /^=begin\b[^]*?^=end.*|#.*/m, flags: "m", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /<<[-~]?'([A-Z_]\w*)'[^]*?^[\t ]*\1\b/m, flags: "m", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /<<[-~]?(["`]?)([A-Z_]\w*)\1[^]*?^[\t ]*\2\b/m, flags: "m", type: "str", sub: "", subRules: [
			{ re: /\\[^]/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
			{ re: /#\{(?:[^{}]|\{[^{}]*\})*\}?/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /%[qQwWiIrsx]?(?:\[(?:\\[^]|\[[^[\]]*\]|[^[\]])*\]|\((?:\\[^]|\([^()]*\)|[^()])*\)|\{(?:\\[^]|\{[^{}]*\}|[^{}])*\}|<(?:\\[^]|<[^<>]*>|[^<>])*>)[a-z]*|%[qQwWiIrsx]([^\s\w])(?:\\[^]|(?!\1)[^])*\1/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\\[^]/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
			{ re: /#\{(?:[^{}]|\{[^{}]*\})*\}?/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /"(?:\\[^]|#\{(?:[^{}]|\{[^{}]*\})*\}|[^"\\])*"?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\\[^]/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
			{ re: /#\{(?:[^{}]|\{[^{}]*\})*\}?/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /'(?:\\[^]|[^'\\])*'?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /`(?:\\[^]|[^`\\])*`?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\\[^]/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
			{ re: /#\{(?:[^{}]|\{[^{}]*\})*\}?/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /(?<=[=(,~!|&[{;]\s*|\b(?:when|in|and|or|not|match|g?sub|split|scan|grep|index)\s|^\s*)\/(?:\\[^]|\[(?:\\[^]|[^\r\n\]])*\]|[^\r\n\\/])+\/[imxounse]*/m, flags: "m", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /\?(?:\\\w|[^\s\\])(?![\w?!])/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<!:):(?!:)(?:[a-z_]\w*[?!=]?|"(?:\\[^]|[^"])*")|\b[a-z_]\w*[?!]?(?=:(?![:=]))/i, flags: "i", type: "type", sub: "", subRules: NO_SUB_RULES },
			{ re: /@@?[a-z_]\w*|\$(?:[a-z_]\w*|[!@&`'+~=/\\,;.<>_*$?:0-9])/i, flags: "i", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b0[box][\da-f_]+r?i?|\b\d[\d_]*(?:\.\d[\d_]*)?(?:e[+-]?\d+)?r?i?\b/i, flags: "i", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false|nil)\b(?![?!])/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /\bdefined\?|\b(__ENCODING__|__FILE__|__LINE__|__dir__|__method__|BEGIN|END|alias|alias_method|and|attr_accessor|attr_reader|attr_writer|begin|break|case|catch|class|def|define_method|do|else|elsif|end|ensure|extend|for|if|in|include|lambda|module|module_function|new|next|not|or|prepend|private|proc|protected|public|raise|redo|require|require_relative|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\bdef\s+(?:self\.)?)[a-z_]\w*[?!=]?/i, flags: "i", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z]\w*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[a-z_]\w*[?!](?![=~])|[a-z_]\w*(?=\s*\()/i, flags: "i", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /:+[-+*/%~!&|^<>=?,.]*|[-+*/%~!&|^<>=?,.]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_REGEX: ShjLanguageDefinition = {
	rules: [
			{ re: /^(?!\/).*/m, flags: "m", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /\[((?!\])[^\\]|\\.)*\]/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\||\^|\$|\\.|\w+($|\r|\n)/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\*|\+|\{\d+,\d+\}/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "oper",
};

const LANG_RS: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /b?r(#*)"[^]*?"\1/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /b?"((?!")[^\r\n\\]|\\[^])*"?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /b?'(\\u\{[\da-fA-F]+\}|\\[^]|[^\\'])'/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(as|break|const|continue|crate|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|async|await|dyn|abstract|become|box|do|final|macro|override|priv|typeof|unsized|virtual|yield|try)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z][\w_]*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z_][\w_]*(?=\s*!?\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_SCSS: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /url\([^)]*\)/, flags: "", type: "", sub: "", subRules: [
			{ re: /url(?=\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[^()]+/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /#\{[^{}]*\}?/, flags: "", type: "oper", sub: "", subRules: [
			{ re: /\$[\w-]+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /[\w-]+(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\$[\w-]+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /@[\w-]+|![\w-]+|\b(and|as|else|from|hide|if|in|not|only|or|show|through|to|using|with)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false|null)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=@(?:mixin|include|function)\s+)[\w-]+/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[.%]-?[a-zA-Z_][\w-]*(?![\w(-])|&[\w-]*|::?[a-zA-Z][\w-]*(?=[^{};]*(?<![#@])\{)/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /#[\w-]+(?=[^{};]*(?<![#@])\{)|(?<![$@!=:([]\s*)\b[a-z][\w-]*(?=[^{};]*(?<![#@])\{)/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /--[\w-]+|[\w-]+(?=([#@]\{[^{}]*\})*\s*[:=])/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /#[\da-fA-F]{3,8}\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.\d+|\d+(\.\d+)?)(cm|mm|in|px|pt|pc|em|ex|ch|rem|vmin|vmax|vw|vh|deg|rad|turn|ms|s|fr|%)?/, flags: "", type: "num", sub: "", subRules: [
			{ re: /[a-z]+|%/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\b[\w-]+(?=\.[$a-zA-Z_-])/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[\w-]+(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[!<>=+*/~%-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[a-z-]+\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_SQL: ShjLanguageDefinition = {
	rules: [
			{ re: /--.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i, flags: "i", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:S|ING)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i, flags: "i", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\.?\d[\d.oxa-fA-F-]*|\bNULL\b/i, flags: "i", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(TRUE|FALSE)\b/i, flags: "i", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|IN|ILIKE|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i, flags: "i", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /@\S+/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_SWIFT: ShjLanguageDefinition = {
	rules: [
			{ re: /\/\/\/.*\n?|\/\*\*(?:[^*]|\*(?!\/))*(?:\*\/)?/, flags: "", type: "cmnt", sub: "", subRules: [
			{ re: /[-+*][ \t]*\w+(?=[ \t]*\w*:)/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(TODO|FIXME|DEBUG|OPTIMIZE|WARNING|XXX|BUG)\b/, flags: "", type: "err", sub: "", subRules: NO_SUB_RULES },
			{ re: /\bIDEA\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(CHANGED|FIX|CHANGE)\b/, flags: "", type: "insert", sub: "", subRules: NO_SUB_RULES },
			{ re: /\bQUESTION\b/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\/\/.*\n?|\/\*(?:[^/*]|\/(?!\*)|\*(?!\/)|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(#+)"""[^]*?"""\1|(#+)"[^\r\n]*?"\2/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\\#+\((?:[^()]|\([^()]*\))*\)/, flags: "", type: "esc", sub: "", subRules: [
			{ re: /(?<=^\\#+\()[^]*(?=\)$)/, flags: "", type: "", sub: "swift", subRules: NO_SUB_RULES },
		] },
		] },
			{ re: /"""[^]*?(?:"""|$)/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\\\((?:[^()]|\([^()]*\))*\)/, flags: "", type: "esc", sub: "", subRules: [
			{ re: /(?<=^\\\()[^]*(?=\)$)/, flags: "", type: "", sub: "swift", subRules: NO_SUB_RULES },
		] },
			{ re: /\\u\{[\da-fA-F]+\}|\\[^]/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /"(?:\\\((?:[^()]|\([^()]*\))*\)|\\[^]|(?!")[^\r\n\\])*"?/, flags: "", type: "str", sub: "", subRules: [
			{ re: /\\\((?:[^()]|\([^()]*\))*\)/, flags: "", type: "esc", sub: "", subRules: [
			{ re: /(?<=^\\\()[^]*(?=\)$)/, flags: "", type: "", sub: "swift", subRules: NO_SUB_RULES },
		] },
			{ re: /\\u\{[\da-fA-F]+\}|\\[^]/, flags: "", type: "esc", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\b0[xX][\da-fA-F_]+(?:\.[\da-fA-F_]+)?(?:[pP][+-]?\d+)?|\b0[bBoO][\d_]+|\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(?:true|false|nil)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[@#]\w+/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(?:Any|Self|_|actor|any|as|associatedtype|async|await|borrowing|break|case|catch|class|consuming|continue|convenience|default|defer|deinit|didSet|do|dynamic|each|else|enum|extension|fallthrough|fileprivate|final|for|func|get|guard|if|import|in|indirect|infix|init|inout|internal|is|isolated|lazy|let|macro|mutating|nonisolated|nonmutating|open|operator|override|package|postfix|precedencegroup|prefix|private|protocol|public|repeat|required|rethrows|return|self|set|some|static|struct|subscript|super|switch|throw|throws|try|typealias|unowned|var|weak|where|while|willSet)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=\bfunc\s+)\w+/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\$\w+|\\\.\w*/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z]\w*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[a-zA-Z_]\w*(?=\s*\()/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_TODO: ShjLanguageDefinition = {
	rules: [
			{ re: /\b(TODO|FIXME|DEBUG|OPTIMIZE|WARNING|XXX|BUG)\b/, flags: "", type: "err", sub: "", subRules: NO_SUB_RULES },
			{ re: /\bIDEA\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(CHANGED|FIX|CHANGE)\b/, flags: "", type: "insert", sub: "", subRules: NO_SUB_RULES },
			{ re: /\bQUESTION\b/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "cmnt",
};

const LANG_TOML: ShjLanguageDefinition = {
	rules: [
			{ re: /#.*/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /("""|''')((?!\1)[^]|\\[^])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /^\[.+\]\s*$/m, flags: "m", type: "section", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(inf|nan)\b|\d[\d:ZT.-]*/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[+,.=-]/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[\w-]+(?=\s*=)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_TS: ShjLanguageDefinition = {
	rules: [
			{ re: /:\s*(any|void|number|boolean|string|object|never|enum)\b/, flags: "", type: "type", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(type|namespace|typedef|interface|public|private|protected|implements|declare|abstract|readonly)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=[{,]\s*)(("|')((?!\2)[^\r\n\\]|\\[^])*\2|[a-zA-Z]\w*)(?=\s*:)/, flags: "", type: "", sub: "", subRules: NO_SUB_RULES },
			{ re: /\/\*\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "jsdoc", subRules: NO_SUB_RULES },
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /`((?!`)[^]|\\[^])*`?/, flags: "", type: "", sub: "js_template_literals", subRules: NO_SUB_RULES },
			{ re: /=>|\b(this|set|get|as|async|await|break|case|catch|class|const|constructor|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|let|var|of|new|package|private|protected|public|return|static|super|switch|throw|throws|try|typeof|void|while|with|yield)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\/((?!\/)[^\r\n\\]|\\.)+\/[dgimsuy]*/, flags: "", type: "", sub: "regex", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(NaN|null|undefined|[A-Z][A-Z_]*)\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z][\w_]*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z$_][\w$_]*(?=\s*((\?\.)?\s*\(|=\s*(\(?[\w,{}[\])]+\)? =>|function\b)))/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_TSX: ShjLanguageDefinition = {
	rules: [
			{ re: /(?<![$\w])<([:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*)(?:\s+[$\w{}.:-]+(?:\s*=\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|"[^"]*"?|'[^']*'?|[^"'>\s][^>\s]*))?)*\s*>[^]*?<\/\1\s*>|<>[^]*?<\/>|(?<![$\w])<[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*(?:\s+[$\w{}.:-]+(?:\s*=\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|"[^"]*"?|'[^']*'?|[^"'>\s][^>\s]*))?)*\s*\/?>|<\/(?:[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*)?\s*>/, flags: "", type: "", sub: "", subRules: [
			{ re: /<[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*(?:\s+[$\w{}.:-]+(?:\s*=\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|"[^"]*"?|'[^']*'?|[^"'>\s][^>\s]*))?)*\s*\/?>|<\/(?:[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*)?\s*>|<>/, flags: "", type: "", sub: "", subRules: [
			{ re: /^<\/?(?:[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*)?/, flags: "", type: "var", sub: "", subRules: [
			{ re: /^<\/?/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /=\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/, flags: "", type: "bracket", sub: "", subRules: [
			{ re: /^=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=^=\{)[^]+(?=\}$)/, flags: "", type: "", sub: "tsx", subRules: NO_SUB_RULES },
		] },
			{ re: /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/, flags: "", type: "bracket", sub: "", subRules: [
			{ re: /(?<=^\{)[^]+(?=\}$)/, flags: "", type: "", sub: "tsx", subRules: NO_SUB_RULES },
		] },
			{ re: /=\s*(?:"[^"]*"?|'[^']*'?|[^"'>\s][^>\s]*)/, flags: "", type: "str", sub: "", subRules: [
			{ re: /^=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\/?>/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/, flags: "", type: "bracket", sub: "", subRules: [
			{ re: /(?<=^\{)[^]+(?=\}$)/, flags: "", type: "", sub: "tsx", subRules: NO_SUB_RULES },
		] },
			{ re: /&(#x?)?[\da-z]{1,8};/i, flags: "i", type: "var", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /:\s*(any|void|number|boolean|string|object|never|enum)\b/, flags: "", type: "type", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(type|namespace|typedef|interface|public|private|protected|implements|declare|abstract|readonly)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=[{,]\s*)(("|')((?!\2)[^\r\n\\]|\\[^])*\2|[a-zA-Z]\w*)(?=\s*:)/, flags: "", type: "", sub: "", subRules: NO_SUB_RULES },
			{ re: /\/\*\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "jsdoc", subRules: NO_SUB_RULES },
			{ re: /\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /`((?!`)[^]|\\[^])*`?/, flags: "", type: "", sub: "js_template_literals", subRules: NO_SUB_RULES },
			{ re: /=>|\b(this|set|get|as|async|await|break|case|catch|class|const|constructor|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|let|var|of|new|package|private|protected|public|return|static|super|switch|throw|throws|try|typeof|void|while|with|yield)\b/, flags: "", type: "kwd", sub: "", subRules: NO_SUB_RULES },
			{ re: /\/((?!\/)[^\r\n\\]|\\.)+\/[dgimsuy]*/, flags: "", type: "", sub: "regex", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(NaN|null|undefined|[A-Z][A-Z_]*)\b/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(true|false)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[/*+:?&|%^~=!,<>.^-]+/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b[A-Z][\w_]*\b/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z$_][\w$_]*(?=\s*((\?\.)?\s*\(|=\s*(\(?[\w,{}[\])]+\)? =>|function\b)))/, flags: "", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_URI: ShjLanguageDefinition = {
	rules: [
			{ re: /^#.*/m, flags: "m", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /^\w+(?=:)/m, flags: "m", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /:\d+/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[:/&?]|\w+=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[.\w]+@|#[\w]+$/m, flags: "m", type: "func", sub: "", subRules: NO_SUB_RULES },
			{ re: /\w+\.\w+(\.\w+)*/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_XML: ShjLanguageDefinition = {
	rules: [
			{ re: /<!--[^]*?-->/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /<!\[CDATA\[[\s\S]*?\]\]>/i, flags: "i", type: "class", sub: "", subRules: NO_SUB_RULES },
			{ re: /<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*(\s+[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*\s*(=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\4)[^])*\4?)?)?)*\s*[/!?]?>/, flags: "", type: "", sub: "", subRules: [
			{ re: /^<[/!?]?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "var", sub: "", subRules: [
			{ re: /^<[/!?]?/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /=\s*([^"'>\s][^>\s]*|("|')(\\[^]|(?!\2)[^])*\2?)/, flags: "", type: "str", sub: "", subRules: [
			{ re: /^=/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /[/!?]?>/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "class", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /<\?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*([^?]|\?[^?>])*\?+>/, flags: "", type: "str", sub: "", subRules: [
			{ re: /^<\?[:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][:A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\-\.0-9\u00b7\u0300-\u036f\u203f-\u2040]*/, flags: "", type: "var", sub: "", subRules: [
			{ re: /^<\?/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /\?+>$/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
		] },
			{ re: /&(#x?)?[\da-z]{1,8};/i, flags: "i", type: "var", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

const LANG_YAML: ShjLanguageDefinition = {
	rules: [
			{ re: /#.*/, flags: "", type: "", sub: "todo", subRules: NO_SUB_RULES },
			{ re: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/, flags: "", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=^( *)-([ \t]+)(?:\S[^\r\n]*:[ \t]+|[-?:][ \t]+)(?:[!&]\S+[ \t]+)*)[>|](?:[1-9][+-]?|[+-][1-9]?)?(?:[ \t]+#.*)?[ \t]*\r?\n(?:(?:\1 \2 +[^\r\n]*|[ \t]*)(?:\r?\n|$))*/m, flags: "m", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /(?<=^( *)(?:(?!-[ \t])\S[^\r\n]*:[ \t]+|[-?:][ \t]+)(?:[!&]\S+[ \t]+)*)[>|](?:[1-9][+-]?|[+-][1-9]?)?(?:[ \t]+#.*)?[ \t]*\r?\n(?:(?:\1 +[^\r\n]*|[ \t]*)(?:\r?\n|$))*/m, flags: "m", type: "str", sub: "", subRules: NO_SUB_RULES },
			{ re: /!![a-z]+/, flags: "", type: "type", sub: "", subRules: NO_SUB_RULES },
			{ re: /\b(Yes|No)\b/, flags: "", type: "bool", sub: "", subRules: NO_SUB_RULES },
			{ re: /[+:-]/, flags: "", type: "oper", sub: "", subRules: NO_SUB_RULES },
			{ re: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/, flags: "", type: "num", sub: "", subRules: NO_SUB_RULES },
			{ re: /[a-zA-Z][\w-]*(?=:)/, flags: "", type: "var", sub: "", subRules: NO_SUB_RULES },
			{ re: /[{}[\]()]/, flags: "", type: "bracket", sub: "", subRules: NO_SUB_RULES },
		],
	defaultType: "",
};

export const SYNTAX_LANGUAGES: Record<string, ShjLanguageDefinition> = {
	"md": LANG_MD,
	"js_template_literals": LANG_JS_TEMPLATE_LITERALS,
	"kt": LANG_KT,
	"dart": LANG_DART,
	"asm": LANG_ASM,
	"bash": LANG_BASH,
	"c": LANG_C,
	"cpp": LANG_CPP,
	"cs": LANG_CS,
	"css": LANG_CSS,
	"csv": LANG_CSV,
	"diff": LANG_DIFF,
	"docker": LANG_DOCKER,
	"go": LANG_GO,
	"graphql": LANG_GRAPHQL,
	"html": LANG_HTML,
	"http": LANG_HTTP,
	"ini": LANG_INI,
	"java": LANG_JAVA,
	"js": LANG_JS,
	"jsdoc": LANG_JSDOC,
	"json": LANG_JSON,
	"jsx": LANG_JSX,
	"less": LANG_LESS,
	"log": LANG_LOG,
	"lua": LANG_LUA,
	"make": LANG_MAKE,
	"php": LANG_PHP,
	"pl": LANG_PL,
	"plain": LANG_PLAIN,
	"ps1": LANG_PS1,
	"py": LANG_PY,
	"rb": LANG_RB,
	"regex": LANG_REGEX,
	"rs": LANG_RS,
	"scss": LANG_SCSS,
	"sql": LANG_SQL,
	"swift": LANG_SWIFT,
	"todo": LANG_TODO,
	"toml": LANG_TOML,
	"ts": LANG_TS,
	"tsx": LANG_TSX,
	"uri": LANG_URI,
	"xml": LANG_XML,
	"yaml": LANG_YAML,
	"cc": LANG_CPP,
	"cjs": LANG_JS,
	"csharp": LANG_CS,
	"cts": LANG_TS,
	"cxx": LANG_CPP,
	"dockerfile": LANG_DOCKER,
	"golang": LANG_GO,
	"gql": LANG_GRAPHQL,
	"h": LANG_C,
	"hpp": LANG_CPP,
	"htm": LANG_HTML,
	"javascript": LANG_JS,
	"json5": LANG_JSON,
	"jsonc": LANG_JSON,
	"jsonl": LANG_JSON,
	"kotlin": LANG_KT,
	"kts": LANG_KT,
	"makefile": LANG_MAKE,
	"markdown": LANG_MD,
	"mjs": LANG_JS,
	"mk": LANG_MAKE,
	"mts": LANG_TS,
	"ndjson": LANG_JSON,
	"patch": LANG_DIFF,
	"perl": LANG_PL,
	"powershell": LANG_PS1,
	"pwsh": LANG_PS1,
	"python": LANG_PY,
	"ruby": LANG_RB,
	"rust": LANG_RS,
	"sh": LANG_BASH,
	"shell": LANG_BASH,
	"svg": LANG_XML,
	"text": LANG_PLAIN,
	"txt": LANG_PLAIN,
	"typescript": LANG_TS,
	"url": LANG_URI,
	"yml": LANG_YAML,
	"zsh": LANG_BASH,
};
