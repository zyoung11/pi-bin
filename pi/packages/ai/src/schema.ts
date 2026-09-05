/**
 * Minimal JSON Schema builder, validator and converter producing typebox-1.x-compatible wire
 * shapes: plain objects whose JSON serialization is byte-identical to the typebox originals
 * (marker properties never reach the output).
 *
 * Brands are local structural mirrors. Their members carry the runtime shape (records, arrays,
 * plain strings) plus every option field that must survive scriptc's width-coerce casts, while
 * type precision flows through the generic parameters; the local `Static` machinery resolves
 * `Static<typeof schema>` from those parameters, keeping results identical to typebox's Static
 * without importing any npm type.
 */

export type PiLiteralValue = string | number | boolean;

export interface PiSchema {}

export interface PiValidationError {
	keyword: string;
	schemaPath: string;
	instancePath: string;
	params: unknown;
	message: string;
}

export interface PiSchemaOptions {
	description?: string;
}

export interface PiStringOptions extends PiSchemaOptions {
	minLength?: number;
	maxLength?: number;
	pattern?: string;
}

export interface PiNumberOptions extends PiSchemaOptions {
	minimum?: number;
	maximum?: number;
	multipleOf?: number;
}

export interface PiArrayOptions extends PiSchemaOptions {
	minItems?: number;
	maxItems?: number;
}

export interface PiObjectOptions extends PiSchemaOptions {
	additionalProperties?: boolean | PiSchema;
}

export interface PiString {
	type: "string";
	description?: string;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
}

export interface PiNumber {
	type: "number";
	description?: string;
	minimum?: number;
	maximum?: number;
	multipleOf?: number;
}

export interface PiInteger {
	type: "integer";
	description?: string;
	minimum?: number;
	maximum?: number;
	multipleOf?: number;
}

export interface PiBoolean {
	type: "boolean";
	description?: string;
}

export interface PiNull {
	type: "null";
	description?: string;
}

export interface PiUnknown {
	description?: string;
}

export interface PiLiteral<Value extends PiLiteralValue = PiLiteralValue> {
	type: string;
	const: Value;
	description?: string;
}

export interface PiOptional<Sub extends PiSchema = PiSchema> {
	"~optional": Sub;
}

export interface PiObject<_Properties extends Record<string, PiSchema> = Record<string, PiSchema>> {
	type: "object";
	properties: Record<string, PiSchema>;
	required?: string[];
	description?: string;
	additionalProperties?: boolean | Record<string, unknown>;
}

export interface PiArray<_Items extends PiSchema = PiSchema> {
	type: "array";
	items: PiSchema;
	description?: string;
	minItems?: number;
	maxItems?: number;
}

export interface PiUnion<_Types extends PiSchema[] = PiSchema[]> {
	anyOf: PiSchema[];
	description?: string;
}

export interface PiRecord<_Key extends PiSchema = PiSchema, Value extends PiSchema = PiSchema> {
	type: "object";
	patternProperties: { "^.*$": Value };
	description?: string;
	additionalProperties?: boolean | Record<string, unknown>;
}

export interface PiRef<Name extends string = string> {
	$ref: Name;
	description?: string;
}

export interface PiCyclic<
	_Defs extends Record<string, PiSchema> = Record<string, PiSchema>,
	Ref extends string = string,
> {
	$defs: Record<string, PiSchema>;
	$ref: Ref;
	description?: string;
}

export interface PiUnsafe<_Type = unknown> {}

export type Static<S> = StaticOf<S, StaticDefs>;

type StaticDefs = Record<string, unknown>;

type StaticOf<S, Defs extends StaticDefs> = [S] extends [PiOptional<infer Sub>]
	? StaticOf<Sub, Defs> | undefined
	: [S] extends [PiCyclic<infer Defs2, infer Ref>]
		? StaticCyclicRef<Defs2, Ref>
		: [S] extends [PiRef<infer Name>]
			? StaticRef<Name, Defs>
			: [S] extends [PiObject<infer Properties>]
				? StaticObjectOf<Properties, Defs>
				: [S] extends [PiRecord<infer _RecordKey, infer Value>]
					? { [key: string]: StaticOf<Value, Defs> }
					: [S] extends [PiArray<infer Items>]
						? StaticOf<Items, Defs>[]
						: [S] extends [PiUnion<infer Types>]
							? StaticUnionOf<Types, Defs>
							: [S] extends [PiLiteral<infer Value>]
								? Value
								: [S] extends [PiString]
									? string
									: [S] extends [PiNumber]
										? number
										: [S] extends [PiInteger]
											? number
											: [S] extends [PiBoolean]
												? boolean
												: [S] extends [PiNull]
													? null
													: [S] extends [PiUnsafe<infer Type>]
														? Type
														: unknown;

type StaticCyclicRef<Defs, Ref extends string> = [Defs] extends [Record<string, PiSchema>]
	? [Ref] extends [keyof Defs & string]
		? StaticOf<Defs[Ref], Defs>
		: unknown
	: unknown;

type StaticRef<Name extends string, Defs extends StaticDefs> = [Name] extends [keyof Defs & string]
	? StaticOf<Defs[Name], Defs>
	: unknown;

type IsOptionalProp<P> = [P] extends [PiOptional<PiSchema>] ? true : false;

type StaticOptionalInner<S, Defs extends StaticDefs> = [S] extends [PiOptional<infer Sub>]
	? StaticOf<Sub, Defs>
	: unknown;

type StaticObjectOf<Properties, Defs extends StaticDefs> = {
	[K in keyof Properties as IsOptionalProp<Properties[K]> extends true ? never : K]: StaticOf<Properties[K], Defs>;
} & {
	[K in keyof Properties as IsOptionalProp<Properties[K]> extends true ? K : never]?: StaticOptionalInner<
		Properties[K],
		Defs
	>;
};

type StaticUnionOf<Types, Defs extends StaticDefs> = Types extends [infer Left, ...infer Rest]
	? StaticOf<Left, Defs> | StaticUnionOf<Rest, Defs>
	: never;

const OPTIONAL_KEY = "~optional";

type SchemaObject = Record<string, unknown>;

class SchemaBuilders {
	String(options?: PiStringOptions): PiString {
		return {
			type: "string",
			description: options?.description,
			minLength: options?.minLength,
			maxLength: options?.maxLength,
			pattern: options?.pattern,
		} as PiString;
	}

	Number(options?: PiNumberOptions): PiNumber {
		return {
			type: "number",
			description: options?.description,
			minimum: options?.minimum,
			maximum: options?.maximum,
			multipleOf: options?.multipleOf,
		} as PiNumber;
	}

	Integer(options?: PiNumberOptions): PiInteger {
		return {
			type: "integer",
			description: options?.description,
			minimum: options?.minimum,
			maximum: options?.maximum,
			multipleOf: options?.multipleOf,
		} as PiInteger;
	}

	Boolean(options?: PiSchemaOptions): PiBoolean {
		return { type: "boolean", description: options?.description } as PiBoolean;
	}

	Null(options?: PiSchemaOptions): PiNull {
		return { type: "null", description: options?.description } as PiNull;
	}

	Unknown(options?: PiSchemaOptions): PiUnknown {
		return { description: options?.description } as PiUnknown;
	}

	Literal<Value extends PiLiteralValue>(value: Value, options?: PiSchemaOptions): PiLiteral<Value> {
		if (typeof value !== "string" && typeof value !== "boolean" && typeof value !== "number") {
			throw new Error("typebox Literal supports string, number and boolean values");
		}
		const typeName = typeof value === "string" ? "string" : typeof value === "boolean" ? "boolean" : "number";
		return { type: typeName, const: value, description: options?.description } as PiLiteral<Value>;
	}

	Object<Properties extends Record<string, PiSchema>>(
		properties: Properties,
		options?: PiObjectOptions,
	): PiObject<Properties> {
		const props: Record<string, PiSchema> = properties;
		const required: string[] = [];
		const clean: Record<string, PiSchema> = {};
		for (const key of Object.keys(props)) {
			const prop = props[key];
			if (OPTIONAL_KEY in prop) {
				clean[key] = (prop as PiOptional<PiSchema>)["~optional"];
			} else {
				clean[key] = prop;
				required.push(key);
			}
		}
		const additional = options?.additionalProperties as boolean | Record<string, unknown> | undefined;
		return {
			type: "object",
			required: required.length > 0 ? required : undefined,
			properties: clean,
			description: options?.description,
			additionalProperties: additional,
		} as PiObject<Properties>;
	}

	Array<Items extends PiSchema>(items: Items, options?: PiArrayOptions): PiArray<Items> {
		return {
			type: "array",
			items,
			description: options?.description,
			minItems: options?.minItems,
			maxItems: options?.maxItems,
		} as PiArray<Items>;
	}

	Union<Types extends PiSchema[]>(anyOf: [...Types], options?: PiSchemaOptions): PiUnion<Types> {
		const list: PiSchema[] = anyOf;
		return { anyOf: list, description: options?.description } as PiUnion<Types>;
	}

	Optional<Sub extends PiSchema>(type: Sub): PiOptional<Sub> {
		return { "~optional": type } as PiOptional<Sub>;
	}

	Record<_Key extends PiSchema, Value extends PiSchema>(
		_key: _Key,
		value: Value,
		options?: PiObjectOptions,
	): PiRecord<_Key, Value> {
		const additional = options?.additionalProperties as boolean | Record<string, unknown> | undefined;
		return {
			type: "object",
			patternProperties: { "^.*$": value },
			description: options?.description,
			additionalProperties: additional,
		} as PiRecord<_Key, Value>;
	}

	Ref<Name extends string>(ref: Name, options?: PiSchemaOptions): PiRef<Name> {
		return { $ref: ref, description: options?.description } as PiRef<Name>;
	}

	Cyclic<Defs extends Record<string, PiSchema>, Ref extends string>(
		$defs: Defs,
		$ref: Ref,
		options?: PiSchemaOptions,
	): PiCyclic<Defs, Ref> {
		const inputDefs: Record<string, PiSchema> = $defs;
		const defs: Record<string, PiSchema> = {};
		for (const key of Object.keys(inputDefs)) {
			defs[key] = { ...(inputDefs[key] as SchemaObject), $id: key } as PiSchema;
		}
		return { $defs: defs, $ref, description: options?.description } as PiCyclic<Defs, Ref>;
	}

	Unsafe<Type>(schema: PiSchema): PiUnsafe<Type> {
		return schema as PiUnsafe<Type>;
	}
}

export const Type = new SchemaBuilders();

export default Type;

export interface CompiledSchema {
	Check(value: unknown): boolean;
	Errors(value: unknown): PiValidationError[];
}

interface ValidatorCacheEntry {
	schema: SchemaObject;
	compiled: CompiledSchema;
}

const validatorCache: ValidatorCacheEntry[] = [];

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
	for (const aKey of aKeys) {
		if (!(aKey in b)) return false;
		if (!deepEqual(a[aKey], b[aKey])) return false;
	}
	return true;
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
	errors: PiValidationError[],
): void {
	const branches: SchemaObject[] = [];
	if (Array.isArray(branchesValue)) {
		for (const item of branchesValue) {
			if (isPlainObject(item)) branches.push(item);
		}
	}
	if (branches.length === 0) return;
	const passingIndexes: number[] = [];
	let bestErrors: PiValidationError[] | undefined;
	for (let index = 0; index < branches.length; index += 1) {
		const branchErrors: PiValidationError[] = [];
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
	errors: PiValidationError[],
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

	if (target.const !== undefined && !deepEqual(value, target.const)) {
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
		const allowedValues = enumValues as string[];
		errors.push({
			keyword: "enum",
			schemaPath: "#",
			instancePath: path,
			params: { allowedValues },
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
		const propertyNames: string[] = isPlainObject(properties) ? Object.keys(properties) : [];
		const requiredList = Array.isArray(target.required)
			? (target.required as unknown[]).filter((item): item is string => typeof item === "string")
			: [];
		const missing = requiredList.filter((name) => !(name in value));
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
				if (!isPlainObject(sub) || !(name in value)) continue;
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
	const run = (value: unknown): PiValidationError[] => {
		const errors: PiValidationError[] = [];
		validateNode(ctx, schema, value, "", errors);
		return errors;
	};
	return {
		Check(value: unknown): boolean {
			return run(value).length === 0;
		},
		Errors(value: unknown): PiValidationError[] {
			return run(value);
		},
	};
}

export function Compile(schema: PiSchema): CompiledSchema {
	const object = schema as SchemaObject;
	for (const entry of validatorCache) {
		if (entry.schema === object) return entry.compiled;
	}
	const compiled = createCompiled(object);
	validatorCache.push({ schema: object, compiled });
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
	Check<const Schema extends PiSchema>(schema: Schema, value: unknown): value is Static<Schema> {
		return Compile(schema).Check(value);
	},

	Convert(schema: PiSchema, value: unknown): void {
		const root = schema as SchemaObject;
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
				if (!isPlainObject(sub) || !(name in value)) continue;
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
			const propertyNames: string[] = isPlainObject(properties) ? Object.keys(properties) : [];
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
	const errors: PiValidationError[] = [];
	validateNode({ defs }, node, value, "", errors);
	return errors.length === 0;
}

export const Guard = {
	IsDeepEqual(left: unknown, right: unknown): boolean {
		return deepEqual(left, right);
	},
};
