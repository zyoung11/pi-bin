import type { Tool } from "../types.ts";

class UnsupportedStrictJsonSchemaError extends Error {}

const UNSUPPORTED_STRICT_SCHEMA_KEYS = [
	"$ref",
	"$defs",
	"definitions",
	"allOf",
	"oneOf",
	"patternProperties",
	"dependentSchemas",
	"dependencies",
	"unevaluatedProperties",
	"propertyNames",
	"contains",
	"prefixItems",
	"not",
	"if",
	"then",
	"else",
] as const;

function isSchemaRecord(value: unknown): boolean {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asSchemaRecord(value: unknown): Record<string, unknown> | undefined {
	if (!isSchemaRecord(value)) return undefined;
	return value as unknown as Record<string, unknown>;
}

function arrayUnknown(value: unknown): unknown[] | undefined {
	if (!Array.isArray(value)) return undefined;
	return value as unknown as unknown[];
}

function isStringArray(value: unknown): boolean {
	const list = arrayUnknown(value);
	if (list === undefined) return false;
	for (const item of list) {
		if (typeof item !== "string") return false;
	}
	return true;
}

function stringArrayOf(value: unknown): string[] | undefined {
	if (!isStringArray(value)) return undefined;
	return value as unknown as string[];
}

function stringInValues(values: unknown[], target: string): boolean {
	for (const value of values) {
		if (typeof value === "string" && value === target) return true;
	}
	return false;
}

function includesNull(values: unknown[]): boolean {
	for (const value of values) {
		if (value === null) return true;
	}
	return false;
}

function isStructuredSchema(schemaValue: unknown): boolean {
	const schema = asSchemaRecord(schemaValue);
	if (schema === undefined) return false;
	const typeValue = schema["type"];
	if (typeof typeValue === "string") {
		return (
			typeValue === "object" ||
			typeValue === "array" ||
			schema["properties"] !== undefined ||
			schema["items"] !== undefined
		);
	}
	const typeList = arrayUnknown(typeValue);
	if (typeList !== undefined) {
		for (const item of typeList) {
			if (item === "object" || item === "array") return true;
		}
	}
	return schema["properties"] !== undefined || schema["items"] !== undefined;
}

function schemaAllowsNull(schemaValue: unknown): boolean {
	const schema = asSchemaRecord(schemaValue);
	if (schema === undefined) return false;
	const typeValue = schema["type"];
	if (typeValue === "null") return true;
	const typeList = arrayUnknown(typeValue);
	if (typeList !== undefined && stringInValues(typeList, "null")) return true;
	if (schema["const"] === null) return true;
	const enumValue = schema["enum"];
	if (Array.isArray(enumValue) && includesNull(enumValue)) return true;
	const anyOfList = arrayUnknown(schema["anyOf"]);
	return anyOfList !== undefined && anyOfList.some((variant) => schemaAllowsNull(variant));
}

function makeJsonSchemaNodeStrict(schemaValue: unknown): void {
	const schema = asSchemaRecord(schemaValue);
	if (schema === undefined) {
		throw new UnsupportedStrictJsonSchemaError("boolean schemas are unsupported");
	}
	for (const key of UNSUPPORTED_STRICT_SCHEMA_KEYS) {
		if (schema[key] !== undefined) {
			throw new UnsupportedStrictJsonSchemaError(`${key} schemas are unsupported`);
		}
	}

	const anyOfValue = schema["anyOf"];
	if (anyOfValue !== undefined) {
		const anyOfList = arrayUnknown(anyOfValue);
		if (anyOfList === undefined || anyOfList.length === 0) {
			throw new UnsupportedStrictJsonSchemaError("anyOf must contain at least one schema");
		}
		for (const variant of anyOfList) {
			if (isStructuredSchema(variant)) {
				throw new UnsupportedStrictJsonSchemaError("object and array unions are unsupported");
			}
			makeJsonSchemaNodeStrict(variant);
		}
	}

	const itemsValue = schema["items"];
	if (itemsValue !== undefined) {
		if (Array.isArray(itemsValue)) {
			throw new UnsupportedStrictJsonSchemaError("tuple schemas are unsupported");
		}
		makeJsonSchemaNodeStrict(itemsValue);
	}

	const isObjectSchema = schema["type"] === "object";
	const propertiesValue = schema["properties"];
	if (propertiesValue !== undefined && !isObjectSchema) {
		throw new UnsupportedStrictJsonSchemaError("properties require type object");
	}
	if (!isObjectSchema) return;
	const additionalPropertiesValue = schema["additionalProperties"];
	if (additionalPropertiesValue !== undefined && additionalPropertiesValue !== false) {
		throw new UnsupportedStrictJsonSchemaError("schema-valued or true additionalProperties is unsupported");
	}
	const propertiesSource = asSchemaRecord(propertiesValue);
	if (propertiesValue !== undefined && propertiesSource === undefined) {
		throw new UnsupportedStrictJsonSchemaError("object properties must be a schema map");
	}
	const requiredValue = schema["required"];
	const requiredList = stringArrayOf(requiredValue);
	if (requiredValue !== undefined && requiredList === undefined) {
		throw new UnsupportedStrictJsonSchemaError("object required must be a string array");
	}

	const properties: Record<string, unknown> = {};
	if (propertiesSource !== undefined) {
		for (const name of Object.keys(propertiesSource)) {
			const entry = propertiesSource[name];
			if (entry !== undefined) properties[name] = entry;
		}
	}
	const propertyNames = Object.keys(properties);
	const required = new Set<string>();
	if (requiredList !== undefined) {
		for (const key of requiredList) required.add(key);
	}
	for (const key of required) {
		if (!propertyNames.includes(key)) {
			throw new UnsupportedStrictJsonSchemaError("required contains an unknown property");
		}
	}
	for (const key of propertyNames) {
		const property = properties[key];
		if (property === undefined) continue;
		makeJsonSchemaNodeStrict(property);
		if (!required.has(key) && !schemaAllowsNull(property)) {
			properties[key] = { anyOf: [property, { type: "null" }] };
		}
	}
	schema["required"] = propertyNames;
	schema["additionalProperties"] = false;
}

export function makeStrictJsonSchema(schema: Tool["parameters"]): Record<string, unknown> {
	const cloned: unknown = structuredClone(schema);
	const record = asSchemaRecord(cloned);
	if (record === undefined) {
		throw new UnsupportedStrictJsonSchemaError("root schema must have type object");
	}
	makeJsonSchemaNodeStrict(record);
	if (record["type"] !== "object") {
		throw new UnsupportedStrictJsonSchemaError("root schema must have type object");
	}
	return record;
}

export function getJsonSchemaToolParameters(tool: Tool, strict: boolean | undefined): Tool["parameters"] {
	return (strict === true ? makeStrictJsonSchema(tool.parameters) : tool.parameters) as Tool["parameters"];
}

export interface GrammarConstrainedSampling {
	format: "lark" | "regex";
	definition: string;
	inputProperty: string;
}

export interface GrammarToolInputJsonBuffer {
	input: string;
	started: boolean;
	closed: boolean;
}

export function getGrammarToolInput(
	toolName: string,
	arguments_: Record<string, unknown>,
	inputProperty: string,
): string {
	const input = arguments_[inputProperty];
	if (typeof input !== "string") {
		throw new Error(`Grammar tool call "${toolName}" requires argument "${inputProperty}" to be a string.`);
	}
	return input;
}

export function appendGrammarToolInputJsonDelta(
	buffer: GrammarToolInputJsonBuffer,
	inputProperty: string,
	nextInput: string,
	close: boolean,
): string | undefined {
	if (buffer.closed) {
		if (close && nextInput === buffer.input) return undefined;
		throw new Error(`grammar tool input for property "${inputProperty}" changed after it was closed`);
	}
	if (!nextInput.startsWith(buffer.input)) {
		throw new Error(`grammar tool input for property "${inputProperty}" changed non-monotonically`);
	}

	const inputDelta = nextInput.slice(buffer.input.length);
	if (!close && inputDelta.length === 0) return undefined;

	let delta = "";
	if (!buffer.started) {
		delta += `{${JSON.stringify(inputProperty)}:"`;
		buffer.started = true;
	}
	delta += JSON.stringify(inputDelta).slice(1, -1);
	buffer.input = nextInput;

	if (close) {
		delta += '"}';
		buffer.closed = true;
	}
	return delta;
}

function inferGrammarInputProperty(tool: Tool): string {
	const schema = asSchemaRecord(tool.parameters);
	if (schema === undefined || schema["type"] !== "object") {
		throw new Error("grammar constrained sampling requires an object parameter schema");
	}
	const requiredList = stringArrayOf(schema["required"]);
	if (requiredList === undefined || requiredList.length !== 1) {
		throw new Error("grammar constrained sampling requires exactly one required string property");
	}

	const inputProperty = requiredList[0];
	const propertiesRecord = asSchemaRecord(schema["properties"]);
	if (propertiesRecord === undefined) {
		throw new Error(`grammar constrained sampling requires a properties entry for ${inputProperty}`);
	}
	const entry = asSchemaRecord(propertiesRecord[inputProperty]);
	if (entry === undefined) {
		throw new Error(`grammar constrained sampling requires a properties entry for ${inputProperty}`);
	}
	if (entry["type"] !== "string") {
		throw new Error(`grammar constrained sampling property ${inputProperty} must have type string`);
	}
	return inputProperty;
}

function readConfigType(config: unknown): string | undefined {
	const record = asSchemaRecord(config);
	if (record === undefined) return undefined;
	const typeValue = record["type"];
	return typeof typeValue === "string" ? typeValue : undefined;
}

function readConfigStrict(config: unknown): string | undefined {
	const record = asSchemaRecord(config);
	if (record === undefined) return undefined;
	const strictValue = record["strict"];
	return typeof strictValue === "string" ? strictValue : undefined;
}

function readConfigVariants(config: unknown): Record<string, unknown> | undefined {
	const record = asSchemaRecord(config);
	if (record === undefined) return undefined;
	return asSchemaRecord(record["variants"]);
}

function resolveJsonSchemaStrictSamplingImpl(tool: Tool, supportsStrictMode: boolean): boolean | undefined {
	const config = tool.constrainedSampling;
	if (readConfigType(config) !== "json_schema") return undefined;
	const strictMode = readConfigStrict(config) ?? "prefer";

	if (supportsStrictMode) {
		try {
			makeStrictJsonSchema(tool.parameters);
			return true;
		} catch (error) {
			if (!(error instanceof UnsupportedStrictJsonSchemaError)) throw error;
			if (strictMode !== "require") return undefined;
			throw new Error(`Tool "${tool.name}" requires JSON-schema constrained sampling, but ${error.message}.`);
		}
	}
	if (strictMode === "require") {
		throw new Error(
			`Tool "${tool.name}" requires JSON-schema constrained sampling, but strict tools are unsupported.`,
		);
	}
	return undefined;
}

function resolveGrammarConstrainedSamplingImpl(
	tool: Tool,
	supportsOpenAIGrammarTools: boolean,
): GrammarConstrainedSampling | undefined {
	const config = tool.constrainedSampling;
	if (readConfigType(config) !== "grammar") return undefined;
	const variants = readConfigVariants(config);
	if (variants === undefined) return undefined;

	if (!supportsOpenAIGrammarTools) return undefined;

	const larkValue = variants["openai_lark"];
	const regexValue = variants["openai_regex"];
	const larkDefinition = typeof larkValue === "string" ? larkValue : undefined;
	const regexDefinition = typeof regexValue === "string" ? regexValue : undefined;
	const hasLarkDefinition = larkDefinition !== undefined && larkDefinition.trim().length > 0;
	const hasRegexDefinition = regexDefinition !== undefined && regexDefinition.trim().length > 0;
	if (!hasLarkDefinition && !hasRegexDefinition) {
		throw new Error(
			`Tool "${tool.name}" cannot use grammar constrained sampling: no supported grammar variant was provided.`,
		);
	}
	try {
		if (hasLarkDefinition && larkDefinition !== undefined) {
			return {
				format: "lark",
				definition: larkDefinition,
				inputProperty: inferGrammarInputProperty(tool),
			};
		}
		if (hasRegexDefinition && regexDefinition !== undefined) {
			return {
				format: "regex",
				definition: regexDefinition,
				inputProperty: inferGrammarInputProperty(tool),
			};
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Tool "${tool.name}" cannot use grammar constrained sampling: ${message}.`);
	}
	return undefined;
}

export function resolveJsonSchemaStrictSampling(tool: Tool, supportsStrictMode: boolean): boolean | undefined {
	return resolveJsonSchemaStrictSamplingImpl(tool, supportsStrictMode);
}

export function resolveGrammarConstrainedSampling(
	tool: Tool,
	supportsOpenAIGrammarTools: boolean,
): GrammarConstrainedSampling | undefined {
	return resolveGrammarConstrainedSamplingImpl(tool, supportsOpenAIGrammarTools);
}

export function createGrammarToolInputProperties(
	tools: Tool[] | undefined,
	supportsOpenAIGrammarTools: boolean,
): Map<string, string> {
	const properties = new Map<string, string>();
	for (const tool of tools ?? []) {
		const grammar = resolveGrammarConstrainedSampling(tool, supportsOpenAIGrammarTools);
		if (grammar) {
			properties.set(tool.name, grammar.inputProperty);
		}
	}
	return properties;
}
