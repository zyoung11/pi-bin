import {
	type SelectItem,
	SelectList,
	type SelectListLayoutOptions,
} from "../../../../../tui/src/components/select-list.ts";
import { Spacer } from "../../../../../tui/src/components/spacer.ts";
import { Text } from "../../../../../tui/src/components/text.ts";
import { Container, type Focusable } from "../../../../../tui/src/tui.ts";
import { getSelectListTheme, theme } from "../theme/theme.ts";
import { DynamicBorder } from "./dynamic-border.ts";

const LLAMA_SELECT_LIST_LAYOUT: SelectListLayoutOptions = {
	minPrimaryColumnWidth: 24,
	maxPrimaryColumnWidth: 56,
};

/**
 * List overlay for the /llama command. Reused for the server picker, the model
 * list, and confirmations; the caller owns the async work and reopens the
 * overlay when the router state changes.
 */
export class LlamaSelectorComponent extends Container implements Focusable {
	private readonly selectList: SelectList;
	private _focused = false;

	get focused(): boolean {
		return this._focused;
	}

	set focused(value: boolean) {
		this._focused = value;
	}

	handleInput(data: string): void {
		this.selectList.handleInput(data);
	}

	constructor(
		title: string,
		subtitle: string,
		items: SelectItem[],
		hints: string,
		onSelect: (value: string) => void,
		onCancel: () => void,
	) {
		super();
		this.addChild(new DynamicBorder());
		this.addChild(new Spacer(1));
		this.addChild(new Text(theme.fg("accent", title), 1, 0));
		if (subtitle.length > 0) this.addChild(new Text(theme.fg("muted", subtitle), 1, 0));
		this.addChild(new Spacer(1));
		const visibleItems = Math.min(Math.max(items.length, 1), 12);
		this.selectList = new SelectList(items, visibleItems, getSelectListTheme(), LLAMA_SELECT_LIST_LAYOUT);
		this.selectList.onSelect = (item) => onSelect(item.value);
		this.selectList.onCancel = onCancel;
		this.addChild(this.selectList);
		this.addChild(new Spacer(1));
		this.addChild(new Text(theme.fg("muted", hints), 1, 0));
		this.addChild(new Spacer(1));
		this.addChild(new DynamicBorder());
	}
}
