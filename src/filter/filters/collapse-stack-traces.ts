import type { Filter } from "../pipeline.ts";

// Match typical stack trace lines: "    at functionName (file:line:col)"
const STACK_FRAME_REGEX = /^\s+at\s+/;
const MAX_FRAMES = 5;
const KEEP_FIRST = 3;
const KEEP_LAST = 2;

export function createCollapseStackTracesFilter(): Filter {
	return {
		name: "collapse-stack-traces",
		apply(text: string): string {
			const lines = text.split("\n");
			const result: string[] = [];

			let i = 0;
			while (i < lines.length) {
				const line = lines[i]!;
				if (STACK_FRAME_REGEX.test(line)) {
					// Collect all consecutive stack frames
					const frames: string[] = [];
					while (i < lines.length && STACK_FRAME_REGEX.test(lines[i]!)) {
						frames.push(lines[i]!);
						i++;
					}
					if (frames.length > MAX_FRAMES) {
						const omitted = frames.length - KEEP_FIRST - KEEP_LAST;
						result.push(...frames.slice(0, KEEP_FIRST));
						result.push(`    [... ${omitted} frames omitted ...]`);
						result.push(...frames.slice(-KEEP_LAST));
					} else {
						result.push(...frames);
					}
				} else {
					result.push(line);
					i++;
				}
			}

			return result.join("\n");
		},
	};
}
