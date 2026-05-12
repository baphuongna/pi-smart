import type { Filter } from "../pipeline.ts";

const MULTI_BLANK = /\n{3,}/g;

export function createCollapseBlanksFilter(): Filter {
	return {
		name: "collapse-blanks",
		apply(text: string): string {
			return text.replace(MULTI_BLANK, "\n\n");
		},
	};
}
