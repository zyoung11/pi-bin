import { Component, Container } from "../../../tui/src/tui.ts";

abstract class Base extends Component {
	protected counter = 0;

	bump(): void {
		this.counter++;
	}

	abstract render(width: number): string[];

	abstract invalidate(): void;
}

class Derived extends Base {
	label = "d";

	render(width: number): string[] {
		return [];
	}

	invalidate(): void {}
}

interface Handle {
	part: Base;
}

function makeHandle(part: Base): Handle {
	return { part };
}

export function main2(): string {
	const derived = new Derived();
	const handle = makeHandle(derived);
	handle.part.bump();
	return handle.part instanceof Derived ? "derived" : "base";
}
