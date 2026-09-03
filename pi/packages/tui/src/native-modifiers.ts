export type ModifierKey = "shift" | "command" | "control" | "option";

type NativeModifiersHelper = {
	isModifierPressed: (name: ModifierKey) => boolean;
};

const nativeModifiersHelper: NativeModifiersHelper | null | undefined = null;

function loadNativeModifiersHelper(): NativeModifiersHelper | undefined {
	// Native accelerator helpers are unavailable in the static build (no module
	// require); the standard input parsing path handles modifier keys.
	return undefined;
}

export function isNativeModifierPressed(key: ModifierKey): boolean {
	const helper = loadNativeModifiersHelper();
	if (!helper) return false;
	try {
		return helper.isModifierPressed(key) === true;
	} catch {
		return false;
	}
}
