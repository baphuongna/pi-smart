import type { Filter } from "../pipeline.ts";

export function createHeadTailFilter(maxLines?: number): Filter {
	const limit = maxLines ?? 100;
	return {
		name: `head-tail:${limit}`,
		apply(text: string): string {
			const lines = text.split("\n");
			if (lines.length <= limit * 2) return text;
			const head = lines.slice(0, limit);
			const tail = lines.slice(-limit);
			const omitted = lines.length - limit * 2;
			return [...head, `[... ${omitted} lines truncated ...]`, ...tail].join("\n");
		},
	};
}
