export interface NativeModuleCandidateOptions {
	moduleUrl?: string;
	execPath?: string;
	resolvePackage?: (specifier: string) => string;
}

/**
 * Native accelerator modules are unavailable in the static build (no module
 * require / import.meta resolution). Returns no candidates so callers fall
 * back to their non-native code paths.
 */
export function getNativeModuleCandidates(_nativePath: string, _options: NativeModuleCandidateOptions = {}): string[] {
	return [];
}
