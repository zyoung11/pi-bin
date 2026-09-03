import type { SegmentData } from "./segmenter.ts";
import { getWordSegmenter, isPunctuationChar, isWhitespaceChar } from "./utils.ts";

const wordSegmenter = getWordSegmenter();

/**
 * Options for word navigation functions.
 * When omitted, uses the default TextSegmenter word segmentation.
 */
export interface WordNavigationOptions {
	/** Custom segmenter returning word segments for the given text. */
	segment?: (text: string) => SegmentData[];
	/** Predicate identifying atomic segments that should be treated as single units (e.g. paste markers). */
	isAtomicSegment?: (segment: string) => boolean;
}

/**
 * Find the cursor position after moving one word backward from `cursor` in `text`.
 * Skips trailing whitespace, then stops at the next word/punctuation boundary.
 *
 * Pure function - does not mutate any state.
 */
export function findWordBackward(text: string, cursor: number, options?: WordNavigationOptions): number {
	if (cursor <= 0) return 0;

	const textBeforeCursor = text.slice(0, cursor);
	const segmentFn = options?.segment;
	const isAtomic = options?.isAtomicSegment;
	const segments = segmentFn ? [...segmentFn(textBeforeCursor)] : [...wordSegmenter.segment(textBeforeCursor)];
	let newCursor = cursor;

	// Skip trailing whitespace
	while (
		segments.length > 0 &&
		!isAtomic?.(segments[segments.length - 1]?.segment || "") &&
		isWhitespaceChar(segments[segments.length - 1]?.segment || "")
	) {
		newCursor -= segments.pop()?.segment.length || 0;
	}

	if (segments.length === 0) return newCursor;

	const last = segments[segments.length - 1]!;

	if (isAtomic?.(last.segment)) {
		// Skip one atomic segment.
		newCursor -= last.segment.length;
	} else if (last.isWordLike) {
		// Skip inside one word-like segment, preserving ASCII punctuation boundaries.
		const segment = last.segment;
		let lastPunct = -1;
		for (let i = 0; i < segment.length; i++) {
			if (isPunctuationChar(segment.charAt(i))) lastPunct = i;
		}
		if (lastPunct === -1) {
			newCursor -= segment.length;
		} else {
			newCursor -= segment.length - (lastPunct + 1);
		}
	} else {
		// Skip non-word non-whitespace run (punctuation)
		while (
			segments.length > 0 &&
			!isAtomic?.(segments[segments.length - 1]?.segment || "") &&
			!segments[segments.length - 1]?.isWordLike &&
			!isWhitespaceChar(segments[segments.length - 1]?.segment || "")
		) {
			newCursor -= segments.pop()?.segment.length || 0;
		}
	}

	return newCursor;
}

/**
 * Find the cursor position after moving one word forward from `cursor` in `text`.
 * Skips leading whitespace, then stops at the next word/punctuation boundary.
 *
 * Pure function - does not mutate any state.
 */
export function findWordForward(text: string, cursor: number, options?: WordNavigationOptions): number {
	if (cursor >= text.length) return text.length;

	const textAfterCursor = text.slice(cursor);
	const segmentFn = options?.segment;
	const isAtomic = options?.isAtomicSegment;
	const segments = segmentFn ? segmentFn(textAfterCursor) : wordSegmenter.segment(textAfterCursor);
	let index = 0;
	let newCursor = cursor;

	// Skip leading whitespace
	while (
		index < segments.length &&
		!isAtomic?.(segments[index]?.segment || "") &&
		isWhitespaceChar(segments[index]?.segment || "")
	) {
		newCursor += segments[index]?.segment.length || 0;
		index++;
	}

	if (index >= segments.length) return newCursor;

	const next = segments[index];

	if (isAtomic?.(next.segment)) {
		// Skip one atomic segment.
		newCursor += next.segment.length;
	} else if (next.isWordLike) {
		// Skip inside one word-like segment, preserving ASCII punctuation boundaries.
		const segment = next.segment;
		let firstPunct = -1;
		for (let i = 0; i < segment.length; i++) {
			if (isPunctuationChar(segment.charAt(i))) {
				firstPunct = i;
				break;
			}
		}
		newCursor += firstPunct === -1 ? segment.length : firstPunct;
	} else {
		// Skip non-word non-whitespace run (punctuation)
		while (
			index < segments.length &&
			!isAtomic?.(segments[index]?.segment || "") &&
			!segments[index]?.isWordLike &&
			!isWhitespaceChar(segments[index]?.segment || "")
		) {
			newCursor += segments[index]?.segment.length || 0;
			index++;
		}
	}

	return newCursor;
}
