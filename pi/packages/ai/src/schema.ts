/**
 * Minimal JSON Schema builder, validator and converter with the same runtime representation as
 * typebox 1.x: plain objects carrying non-enumerable "~kind"/"~optional"/"~unsafe" marker
 * properties. Schemas serialize to clean JSON, and builders are declared to return real typebox
 * brand types so `Static<typeof schema>` resolution stays identical to the typebox original.
 */

import type {
	Static,
	TArray,
	TArrayOptions,
	TBoolean,
	TCyclic,
	TInteger,
	TLiteral,
	TLiteralValue,
	TNull,
	TNumber,
	TNumberOptions,
	TObject,
	TObjectOptions,
	TOptional,
	TProperties,
	TRecord,
	TRef,
	TSchema,
	TSchemaOptions,
	TString,
	TStringOptions,
	TUnion,
	TUnknown,
	TUnsafe,
} from "typebox";
import type { TLocalizedValidationError } from "typebox/error";

const KIND_KEY = "~kind";
const OPTIONAL_KEY = "~optional";
const UNSAFE_KEY = "~unsafe";
const VALIDATOR_KEY = "__piCompiledValidator";

type SchemaObject = Record<string, unknown>;

function defineHidden(target: SchemaObject, key: string, value: unknown): void {
	Object.defineProperty(target, key, { configurable: true, enumerable: false, writable: true, value });
}

function withKind<Brand>(kind: string, schema: SchemaObject): Brand {
	defineHidden(schema, KIND_KEY, kind);
	return schema as unknown as Brand;
}

function cloneOwn(source: SchemaObject): SchemaObject {
	const out: SchemaObject = {};
	for (const key of Object.keys(source)) {
		out[key] = source[key];
	}
	if (KIND_KEY in source) defineHidden(out, KIND_KEY, source[KIND_KEY]);
	if (OPTIONAL_KEY in source) defineHidden(out, OPTIONAL_KEY, source[OPTIONAL_KEY]);
	if (UNSAFE_KEY in source) defineHidden(out, UNSAFE_KEY, source[UNSAFE_KEY]);
	return out;
}

function plainOptions(options: TSchemaOptions | undefined): SchemaObject {
	const out: SchemaObject = {};
	if (!options) return out;
	for (const key of Object.keys(options)) {
		out[key] = options[key];
	}
	return out;
}

export const Type = {
	String(options?: TStringOptions): TString {
		return withKind<TString>("String", { type: "string", ...plainOptions(options) });
	},

	Number(options?: TNumberOptions): TNumber {
		return withKind<TNumber>("Number", { type: "number", ...plainOptions(options) });
	},

	Integer(options?: TNumberOptions): TInteger {
		return withKind<TInteger>("Integer", { type: "integer", ...plainOptions(options) });
	},

	Boolean(options?: TSchemaOptions): TBoolean {
		return withKind<TBoolean>("Boolean", { type: "boolean", ...plainOptions(options) });
	},

	Null(options?: TSchemaOptions): TNull {
		return withKind<TNull>("Null", { type: "null", ...plainOptions(options) });
	},

	Unknown(options?: TSchemaOptions): TUnknown {
		return withKind<TUnknown>("Unknown", plainOptions(options));
	},

	Literal<Value extends TLiteralValue>(value: Value, options?: TSchemaOptions): TLiteral<Value> {
		if (typeof value !== "string" && typeof value !== "boolean" && typeof value !== "number") {
			throw new Error("typebox Literal supports string, number and boolean values");
		}
		const typeName = typeof value === "string" ? "string" : typeof value === "boolean" ? "boolean" : "number";
		return withKind<TLiteral<Value>>("Literal", { type: typeName, const: value, ...plainOptions(options) });
	},

	Object<Properties extends TProperties>(properties: Properties, options?: TObjectOptions): TObject<Properties> {
		const required: string[] = [];
		for (const key of Object.keys(properties)) {
			if ((properties[key] as SchemaObject)[OPTIONAL_KEY] !== true) required.push(key);
		}
		const schema: SchemaObject = { type: "object" };
		if (required.length > 0) schema.required = required;
		schema.properties = properties;
		return withKind<TObject<Properties>>("Object", { ...schema, ...plainOptions(options) });
	},

	Array<Items extends TSchema>(items: Items, options?: TArrayOptions): TArray<Items> {
		return withKind<TArray<Items>>("Array", { type: "array", items, ...plainOptions(options) });
	},

	Union<Types extends TSchema[]>(anyOf: [...Types], options?: TSchemaOptions): TUnion<Types> {
		return withKind<TUnion<Types>>("Union", { anyOf, ...plainOptions(options) });
	},

	Optional<Sub extends TSchema>(type: Sub): TOptional<Sub> {
		const clone = cloneOwn(type as unknown as SchemaObject);
		defineHidden(clone, OPTIONAL_KEY, true);
		return clone as unknown as TOptional<Sub>;
	},

	Record<Key extends TSchema, Value extends TSchema>(
		key: Key,
		value: Value,
		options?: TObjectOptions,
	): TRecord<"^.*$", Value> {
		if ((key as SchemaObject).type !== "string") {
			throw new Error("mini schema Record supports string keys only");
		}
		return withKind<TRecord<"^.*$", Value>>("Record", {
			type: "object",
			patternProperties: { "^.*$": value },
			...plainOptions(options),
		});
	},

	Ref<Name extends string>(ref: Name, options?: TSchemaOptions): TRef<Name> {
		return withKind<TRef<Name>>("Ref", { $ref: ref, ...plainOptions(options) });
	},

	Cyclic<Defs extends TProperties, RefName extends string>(
		$defs: Defs,
		$ref: RefName,
		options?: TSchemaOptions,
	): TCyclic<Defs, RefName> {
		const defs: SchemaObject = {};
		for (const key of Object.keys($defs)) {
			defs[key] = { ...cloneOwn($defs[key] as unknown as SchemaObject), $id: key };
		}
		return withKind<TCyclic<Defs, RefName>>("Cyclic", { $defs: defs, $ref, ...plainOptions(options) });
	},

	Unsafe<Type>(schema: TSchema): TUnsafe<Type> {
		const clone = cloneOwn(schema as unknown as SchemaObject);
		defineHidden(clone, UNSAFE_KEY, null);
		return clone as unknown as TUnsafe<Type>;
	},
};

export default Type;

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepEqual(left: unknown, right: unknown): boolean {
	if (left === right) return true;
	if (typeof left !== "object" || typeof right !== "object") return false;
	if (left === null || right === null) return false;
	if (Array.isArray(left) || Array.isArray(right)) {
		if (!Array.isArray(left) || !Array.isArray(right)) return false;
		if (left.length !== right.length) return false;
		for (let i = 0; i < left.length; i += 1) {
			if (!deepEqual(left[i], right[i])) return false;
		}
		return true;
	}
	const a = left as Record<string, unknown>;
	const b = right as Record<string, unknown>;
	const aKeys = Object.keys(a);
	if (aKeys.length !== Object.keys(b).length) return false;
	for (const key of aKeys) {
		if (!Object.hasOwn(b, key)) return false;
		if (!deepEqual(a[key], b[key])) return false;
	}
	return true;
}

export interface CompiledSchema {
	Check(value: unknown): boolean;
	Errors(value: unknown): TLocalizedValidationError[];
}

interface ValidatorContext {
	defs: Record<string, SchemaObject>;
}

function collectDefs(node: SchemaObject, out: Record<string, SchemaObject>): void {
	const defs = node.$defs;
	if (isPlainObject(defs)) {
		for (const key of Object.keys(defs)) {
			const def = defs[key];
			if (!isPlainObject(def)) continue;
			out[typeof def.$id === "string" ? def.$id : key] = def;
			collectDefs(def, out);
		}
	}
	for (const keyword of ["anyOf", "oneOf", "allOf"]) {
		const list = node[keyword];
		if (!Array.isArray(list)) continue;
		for (const item of list) {
			if (isPlainObject(item)) collectDefs(item, out);
		}
	}
	const properties = node.properties;
	if (isPlainObject(properties)) {
		for (const key of Object.keys(properties)) {
			const sub = properties[key];
			if (isPlainObject(sub)) collectDefs(sub, out);
		}
	}
	const items = node.items;
	if (isPlainObject(items)) {
		collectDefs(items, out);
	} else if (Array.isArray(items)) {
		for (const item of items) {
			if (isPlainObject(item)) collectDefs(item, out);
		}
	}
	const additionalProperties = node.additionalProperties;
	if (isPlainObject(additionalProperties)) collectDefs(additionalProperties, out);
	const patternProperties = node.patternProperties;
	if (isPlainObject(patternProperties)) {
		for (const key of Object.keys(patternProperties)) {
			const sub = patternProperties[key];
			if (isPlainObject(sub)) collectDefs(sub, out);
		}
	}
}

function resolveRef(node: SchemaObject, defs: Record<string, SchemaObject>): SchemaObject {
	let current = node;
	let hops = 0;
	while (hops < 64) {
		const ref = current.$ref;
		if (typeof ref !== "string") return current;
		const def = defs[ref];
		if (!def) return current;
		current = def;
		hops += 1;
	}
	return current;
}

function typeList(node: SchemaObject): string[] {
	const declared = node.type;
	if (typeof declared === "string") return [declared];
	if (Array.isArray(declared)) return declared.filter((item): item is string => typeof item === "string");
	return [];
}

function matchesType(value: unknown, type: string): boolean {
	switch (type) {
		case "string":
			return typeof value === "string";
		case "number":
			return typeof value === "number";
		case "integer":
			return typeof value === "number" && Number.isInteger(value);
		case "boolean":
			return typeof value === "boolean";
		case "null":
			return value === null;
		case "array":
			return Array.isArray(value);
		case "object":
			return isPlainObject(value);
		default:
			return true;
	}
}

function pointerSegment(segment: string): string {
	return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

function childPath(path: string, segment: string): string {
	return `${path}/${pointerSegment(segment)}`;
}

function validateUnionBranches(
	ctx: ValidatorContext,
	keyword: "anyOf" | "oneOf",
	branchesValue: unknown,
	value: unknown,
	path: string,
	errors: TLocalizedValidationError[],
): void {
	const branches: SchemaObject[] = [];
	if (Array.isArray(branchesValue)) {
		for (const item of branchesValue) {
			if (isPlainObject(item)) branches.push(item);
		}
	}
	if (branches.length === 0) return;
	const passingIndexes: number[] = [];
	let bestErrors: TLocalizedValidationError[] | undefined;
	for (let index = 0; index < branches.length; index += 1) {
		const branchErrors: TLocalizedValidationError[] = [];
		validateNode(ctx, branches[index], value, path, branchErrors);
		if (branchErrors.length === 0) {
			passingIndexes.push(index);
			continue;
		}
		if (!bestErrors || branchErrors.length < bestErrors.length) bestErrors = branchErrors;
	}
	const satisfied = keyword === "anyOf" ? passingIndexes.length > 0 : passingIndexes.length === 1;
	if (satisfied) return;
	const message =
		keyword === "anyOf"
			? "must satisfy at least one schema in anyOf"
			: `must satisfy exactly one schema in oneOf, ${passingIndexes.length} matched`;
	errors.push({ keyword, schemaPath: "#", instancePath: path, params: { passingSchemas: passingIndexes }, message });
	if (keyword === "anyOf" && bestErrors) {
		for (const error of bestErrors) errors.push(error);
	}
}

function validateNode(
	ctx: ValidatorContext,
	node: SchemaObject,
	value: unknown,
	path: string,
	errors: TLocalizedValidationError[],
): void {
	const target = resolveRef(node, ctx.defs);

	if (Array.isArray(target.anyOf)) {
		validateUnionBranches(ctx, "anyOf", target.anyOf, value, path, errors);
		return;
	}
	if (Array.isArray(target.oneOf)) {
		validateUnionBranches(ctx, "oneOf", target.oneOf, value, path, errors);
		return;
	}
	if (Array.isArray(target.allOf)) {
		for (const item of target.allOf) {
			if (!isPlainObject(item)) continue;
			validateNode(ctx, item, value, path, errors);
		}
	}

	if ("const" in target && !deepEqual(value, target.const)) {
		errors.push({
			keyword: "const",
			schemaPath: "#",
			instancePath: path,
			params: { allowedValue: target.const },
			message: "must be equal to constant",
		});
	}

	const enumValues = target.enum;
	if (Array.isArray(enumValues) && !enumValues.some((item) => deepEqual(item, value))) {
		errors.push({
			keyword: "enum",
			schemaPath: "#",
			instancePath: path,
			params: { allowedValues: enumValues },
			message: "must be equal to one of the allowed values",
		});
	}

	const declaredTypes = typeList(target);
	if (declaredTypes.length > 0 && !declaredTypes.some((type) => matchesType(value, type))) {
		errors.push({
			keyword: "type",
			schemaPath: "#",
			instancePath: path,
			params: { type: declaredTypes },
			message: `must be ${declaredTypes.join(" | ")}`,
		});
	}

	if (typeof value === "string") {
		const minLength = target.minLength;
		if (typeof minLength === "number" && value.length < minLength) {
			errors.push({
				keyword: "minLength",
				schemaPath: "#",
				instancePath: path,
				params: { limit: minLength },
				message: `must not have fewer than ${minLength} characters`,
			});
		}
		const maxLength = target.maxLength;
		if (typeof maxLength === "number" && value.length > maxLength) {
			errors.push({
				keyword: "maxLength",
				schemaPath: "#",
				instancePath: path,
				params: { limit: maxLength },
				message: `must not have more than ${maxLength} characters`,
			});
		}
		const pattern = target.pattern;
		if (typeof pattern === "string" && !new RegExp(pattern).test(value)) {
			errors.push({
				keyword: "pattern",
				schemaPath: "#",
				instancePath: path,
				params: { pattern },
				message: `must match pattern "${pattern}"`,
			});
		}
	}

	if (typeof value === "number") {
		const minimum = target.minimum;
		if (typeof minimum === "number" && value < minimum) {
			errors.push({
				keyword: "minimum",
				schemaPath: "#",
				instancePath: path,
				params: { comparison: ">=", limit: minimum },
				message: `must be >= ${minimum}`,
			});
		}
		const maximum = target.maximum;
		if (typeof maximum === "number" && value > maximum) {
			errors.push({
				keyword: "maximum",
				schemaPath: "#",
				instancePath: path,
				params: { comparison: "<=", limit: maximum },
				message: `must be <= ${maximum}`,
			});
		}
		const multipleOf = target.multipleOf;
		if (typeof multipleOf === "number" && multipleOf !== 0) {
			const remainder = value / multipleOf;
			if (!Number.isInteger(remainder)) {
				errors.push({
					keyword: "multipleOf",
					schemaPath: "#",
					instancePath: path,
					params: { multipleOf },
					message: `must be a multiple of ${multipleOf}`,
				});
			}
		}
	}

	if (Array.isArray(value)) {
		const minItems = target.minItems;
		if (typeof minItems === "number" && value.length < minItems) {
			errors.push({
				keyword: "minItems",
				schemaPath: "#",
				instancePath: path,
				params: { limit: minItems },
				message: `must not have fewer than ${minItems} items`,
			});
		}
		const maxItems = target.maxItems;
		if (typeof maxItems === "number" && value.length > maxItems) {
			errors.push({
				keyword: "maxItems",
				schemaPath: "#",
				instancePath: path,
				params: { limit: maxItems },
				message: `must not have more than ${maxItems} items`,
			});
		}
		const items = target.items;
		if (isPlainObject(items)) {
			for (let index = 0; index < value.length; index += 1) {
				validateNode(ctx, items, value[index], childPath(path, String(index)), errors);
			}
		} else if (Array.isArray(items)) {
			for (let index = 0; index < Math.min(value.length, items.length); index += 1) {
				const itemSchema = items[index];
				if (!isPlainObject(itemSchema)) continue;
				validateNode(ctx, itemSchema, value[index], childPath(path, String(index)), errors);
			}
		}
	}

	if (isPlainObject(value)) {
		const properties = target.properties;
		const propertyNames = isPlainObject(properties) ? Object.keys(properties) : [];
		const requiredList = Array.isArray(target.required)
			? (target.required as unknown[]).filter((item): item is string => typeof item === "string")
			: [];
		const missing = requiredList.filter((name) => !Object.hasOwn(value, name));
		if (missing.length > 0) {
			errors.push({
				keyword: "required",
				schemaPath: "#",
				instancePath: path,
				params: { requiredProperties: missing },
				message: `must have required properties ${missing.join(" ")}`,
			});
		}

		if (isPlainObject(properties)) {
			for (const name of propertyNames) {
				const sub = properties[name];
				if (!isPlainObject(sub) || !Object.hasOwn(value, name)) continue;
				validateNode(ctx, sub, value[name], childPath(path, name), errors);
			}
		}

		const patterns: { regex: RegExp; schema: SchemaObject }[] = [];
		const patternProperties = target.patternProperties;
		if (isPlainObject(patternProperties)) {
			for (const pattern of Object.keys(patternProperties)) {
				const sub = patternProperties[pattern];
				if (isPlainObject(sub)) patterns.push({ regex: new RegExp(pattern), schema: sub });
			}
		}

		const extraKeys: string[] = [];
		for (const key of Object.keys(value)) {
			if (propertyNames.includes(key)) continue;
			let matched = false;
			for (const entry of patterns) {
				if (!entry.regex.test(key)) continue;
				matched = true;
				validateNode(ctx, entry.schema, value[key], childPath(path, key), errors);
			}
			if (!matched) extraKeys.push(key);
		}

		if (extraKeys.length > 0) {
			const additionalProperties = target.additionalProperties;
			if (additionalProperties === false) {
				errors.push({
					keyword: "additionalProperties",
					schemaPath: "#",
					instancePath: path,
					params: { additionalProperties: [...extraKeys].sort() },
					message: "must not have additional properties",
				});
			} else if (isPlainObject(additionalProperties)) {
				for (const key of extraKeys) {
					validateNode(ctx, additionalProperties, value[key], childPath(path, key), errors);
				}
			}
		}
	}
}

function createCompiled(schema: SchemaObject): CompiledSchema {
	const defs: Record<string, SchemaObject> = {};
	collectDefs(schema, defs);
	const ctx: ValidatorContext = { defs };
	const run = (value: unknown): TLocalizedValidationError[] => {
		const errors: TLocalizedValidationError[] = [];
		validateNode(ctx, schema, value, "", errors);
		return errors;
	};
	return {
		Check(value: unknown): boolean {
			return run(value).length === 0;
		},
		Errors(value: unknown): TLocalizedValidationError[] {
			return run(value);
		},
	};
}

export function Compile(schema: TSchema): CompiledSchema {
	const object = schema as unknown as SchemaObject;
	if (isPlainObject(object)) {
		const cached = object[VALIDATOR_KEY] as CompiledSchema | undefined;
		if (cached && typeof cached.Check === "function") return cached;
	}
	const compiled = createCompiled(object);
	if (isPlainObject(object)) defineHidden(object, VALIDATOR_KEY, compiled);
	return compiled;
}

function coercePrimitive(value: unknown, type: string): unknown {
	switch (type) {
		case "number": {
			if (value === null) return 0;
			if (typeof value === "string" && value.trim() !== "") {
				const parsed = Number(value);
				if (Number.isFinite(parsed)) return parsed;
			}
			if (typeof value === "boolean") return value ? 1 : 0;
			return value;
		}
		case "integer": {
			if (value === null) return 0;
			if (typeof value === "string" && value.trim() !== "") {
				const parsed = Number(value);
				if (Number.isInteger(parsed)) return parsed;
			}
			if (typeof value === "boolean") return value ? 1 : 0;
			return value;
		}
		case "boolean": {
			if (value === null) return false;
			if (typeof value === "string") {
				if (value === "true") return true;
				if (value === "false") return false;
			}
			if (typeof value === "number") {
				if (value === 1) return true;
				if (value === 0) return false;
			}
			return value;
		}
		case "string": {
			if (value === null) return "";
			if (typeof value === "number" || typeof value === "boolean") return String(value);
			return value;
		}
		case "null": {
			if (value === "" || value === 0 || value === false) return null;
			return value;
		}
		default:
			return value;
	}
}

export const Value = {
	Check<const Schema extends TSchema>(schema: Schema, value: unknown): value is Static<Schema> {
		return Compile(schema).Check(value);
	},

	Convert(schema: TSchema, value: unknown): void {
		const root = schema as unknown as SchemaObject;
		const defs: Record<string, SchemaObject> = {};
		collectDefs(root, defs);
		convertNodeWithContext(root, defs, value);
	},
};

function convertNodeWithContext(node: SchemaObject, defs: Record<string, SchemaObject>, value: unknown): unknown {
	const target = resolveRef(node, defs);
	if (Array.isArray(target.allOf)) {
		for (const item of target.allOf) {
			if (!isPlainObject(item)) continue;
			value = convertNodeWithContext(item, defs, value);
		}
	}
	if (Array.isArray(target.anyOf)) return convertUnionWithContext(target, defs, value, target.anyOf);
	if (Array.isArray(target.oneOf)) return convertUnionWithContext(target, defs, value, target.oneOf);

	const declaredTypes = typeList(target);
	if (declaredTypes.length > 0 && !declaredTypes.some((type) => matchesType(value, type))) {
		for (const type of declaredTypes) {
			const coerced = coercePrimitive(value, type);
			if (coerced !== value) {
				value = coerced;
				break;
			}
		}
	}

	if (isPlainObject(value)) {
		const properties = target.properties;
		if (isPlainObject(properties)) {
			for (const name of Object.keys(properties)) {
				const sub = properties[name];
				if (!isPlainObject(sub) || !Object.hasOwn(value, name)) continue;
				value[name] = convertNodeWithContext(sub, defs, value[name]);
			}
		}
		const patternProperties = target.patternProperties;
		if (isPlainObject(patternProperties)) {
			for (const pattern of Object.keys(patternProperties)) {
				const sub = patternProperties[pattern];
				if (!isPlainObject(sub)) continue;
				const regex = new RegExp(pattern);
				for (const name of Object.keys(value)) {
					if (!regex.test(name)) continue;
					value[name] = convertNodeWithContext(sub, defs, value[name]);
				}
			}
		}
		const additionalProperties = target.additionalProperties;
		if (isPlainObject(additionalProperties)) {
			const propertyNames = isPlainObject(properties) ? Object.keys(properties) : [];
			for (const name of Object.keys(value)) {
				if (propertyNames.includes(name)) continue;
				value[name] = convertNodeWithContext(additionalProperties, defs, value[name]);
			}
		}
	}

	if (Array.isArray(value)) {
		const items = target.items;
		if (isPlainObject(items)) {
			for (let index = 0; index < value.length; index += 1) {
				value[index] = convertNodeWithContext(items, defs, value[index]);
			}
		} else if (Array.isArray(items)) {
			for (let index = 0; index < Math.min(value.length, items.length); index += 1) {
				const itemSchema = items[index];
				if (!isPlainObject(itemSchema)) continue;
				value[index] = convertNodeWithContext(itemSchema, defs, value[index]);
			}
		}
	}

	return value;
}

function convertUnionWithContext(
	_node: SchemaObject,
	defs: Record<string, SchemaObject>,
	value: unknown,
	branchesValue: unknown,
): unknown {
	const branches: SchemaObject[] = [];
	if (Array.isArray(branchesValue)) {
		for (const item of branchesValue) {
			if (isPlainObject(item)) branches.push(item);
		}
	}
	for (const branch of branches) {
		if (checkWithContext(branch, defs, value)) return value;
	}
	for (const branch of branches) {
		const candidate = structuredClone(value);
		const coerced = convertNodeWithContext(branch, defs, candidate);
		if (checkWithContext(branch, defs, coerced)) return coerced;
	}
	return value;
}

function checkWithContext(node: SchemaObject, defs: Record<string, SchemaObject>, value: unknown): boolean {
	const errors: TLocalizedValidationError[] = [];
	validateNode({ defs }, node, value, "", errors);
	return errors.length === 0;
}

export const Guard = {
	IsDeepEqual(left: unknown, right: unknown): boolean {
		return deepEqual(left, right);
	},
};
