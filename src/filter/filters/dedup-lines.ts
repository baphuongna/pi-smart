import type { Filter } from "../pipeline.ts";

export function createDedupLinesFilter(): Filter {
	return {
		name: "dedup-lines",
		apply(text: string): string {
			const lines = text.split("\n");
			const result: string[] = [];
			let prev = "";
			for (const line of lines) {
				if (line !== prev) {
					result.push(line);
					prev = line;
				}
			}
			return result.join("\n");
		},
	};
}
