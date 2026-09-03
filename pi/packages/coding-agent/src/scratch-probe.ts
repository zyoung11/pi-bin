import type { FileError, Result } from "../../agent/src/harness/types.ts";

export function p21(v: FileError[]): string {
	return v.length.toString();
}
export function p22(v: Result<string, FileError>[]): string {
	return v.length.toString();
}
export function p23(v: { ok: false; error: FileError }[]): string {
	return v.length.toString();
}
