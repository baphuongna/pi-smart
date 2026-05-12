import type { Filter } from "../pipeline.ts";

export function createStripGitDiffStatsFilter(): Filter {
	return {
		name: "strip-git-diff-stats",
		apply(text: string): string {
			// Match diff --stat blocks: " file | N ++--" lines
			const statLineRegex = /^\s+\S+\s*\|\s*\d+\s*[+-]+\s*$/;
			const summaryRegex = /^\s+\d+ files? changed/;

			const lines = text.split("\n");
			const statLines: number[] = [];
			let summaryLineIdx = -1;

			for (let i = 0; i < lines.length; i++) {
				if (statLineRegex.test(lines[i]!)) {
					statLines.push(i);
				} else if (summaryRegex.test(lines[i]!)) {
					summaryLineIdx = i;
				}
			}

			// If >10 stat lines, remove individual stats but keep summary
			if (statLines.length > 10 && summaryLineIdx >= 0) {
				const result = lines.filter((_line, idx) => !statLines.includes(idx));
				return result.join("\n");
			}

			return text;
		},
	};
}
