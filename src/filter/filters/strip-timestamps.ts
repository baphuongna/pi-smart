import type { Filter } from "../pipeline.ts";

const TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?Z?\s*/gm;

export function createStripTimestampsFilter(): Filter {
	return {
		name: "strip-timestamps",
		apply(text: string): string {
			return text.replace(TIMESTAMP_REGEX, "");
		},
	};
}
