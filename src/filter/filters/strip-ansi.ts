import type { Filter } from "../pipeline.ts";

const ANSI_REGEX = /\x1b\[[0-9;]*[a-zA-Z]/g;

export function createStripAnsiFilter(): Filter {
	return {
		name: "strip-ansi",
		apply(text: string): string {
			return text.replace(ANSI_REGEX, "");
		},
	};
}
