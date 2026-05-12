import type { Filter } from "../pipeline.ts";

// Patterns for test runner preamble lines
const RUNNER_PATTERNS = [
	/^\s*(Running|running)\s+\d+\s+tests?.*$/gm,
	/^\s*(Test suite|test suite)\s+(started|starting).*$/gm,
	/^\s*(PASS|FAIL|SKIP)\s+.*$/gm,
	/^\s*✓\s+\d+\s+(passing|passed).*$/gm,
	/^\s*✗\s+\d+\s+(failing|failed).*$/gm,
	/^\s*Test Suites:\s+.*$/gm,
	/^\s*Tests:\s+.*$/gm,
	/^\s*Snapshots:\s+.*$/gm,
	/^\s*Time:\s+.*$/gm,
	/^\s*----------.*$/gm,
	/^\s*==========.*$/gm,
];

export function createStripTestRunnerHeaderFilter(): Filter {
	return {
		name: "strip-test-runner-header",
		apply(text: string): string {
			const lines = text.split("\n");
			// Keep only lines that look like result summaries or test results
			const resultLines = lines.filter((line) => {
				// Always keep empty lines and indented content
				if (line.trim() === "") return true;
				// Keep lines that look like actual test results (✔, ✗, PASS, FAIL)
				if (/^\s*(✔|✗|✓|✘|PASS|FAIL|SKIP|TODO)\s/.test(line)) return true;
				// Keep summary lines
				if (/^\s*\d+\s+(passing|passed|failing|failed|skipped|pending)/.test(line)) return true;
				// Remove known preamble patterns
				for (const pattern of RUNNER_PATTERNS) {
					if (pattern.test(line)) return false;
				}
				return true;
			});
			return resultLines.join("\n");
		},
	};
}
