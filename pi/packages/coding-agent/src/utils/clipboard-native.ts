export type ClipboardModule = {
	getText: () => Promise<string>;
	setText: (text: string) => Promise<void>;
	hasImage: () => boolean;
	getImageBinary: () => Promise<Array<number>>;
};

const hasDisplay = process.platform !== "linux" || Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);

/**
 * Native clipboard acceleration is unavailable in the static build (no module require).
 * Termux/display-gated callers fall back to the exec-based clipboard paths.
 */
export function loadClipboardNative(_requires?: readonly unknown[]): ClipboardModule | null {
	return null;
}

const clipboard = !process.env.TERMUX_VERSION && hasDisplay ? loadClipboardNative() : null;

export { clipboard };
