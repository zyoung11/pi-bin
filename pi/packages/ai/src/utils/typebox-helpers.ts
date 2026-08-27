import { Type, type PiUnsafe } from "../schema.ts";

/**
 * Creates a string enum schema compatible with Google's API and other providers
 * that don't support anyOf/const patterns.
 *
 * @example
 * const OperationSchema = StringEnum(["add", "subtract", "multiply"], {
 *   description: "The operation to perform"
 * });
 *
 * type Operation = Static<typeof OperationSchema>; // "add" | "subtract" | "multiply"
 */
export function StringEnum<T extends readonly string[]>(
	values: T,
	options?: { description?: string; default?: T[number] },
): PiUnsafe<T[number]> {
	return Type.Unsafe<T[number]>({
		type: "string",
		enum: values,
		description: options?.description,
		default: options?.default,
	});
}
