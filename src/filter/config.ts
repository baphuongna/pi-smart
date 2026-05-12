import type { FilterSpec, PiSmartConfig } from "../config.ts";
import type { Filter } from "./pipeline.ts";

// Lazy imports for filters to keep startup fast
import { createStripAnsiFilter } from "./filters/strip-ansi.ts";
import { createCollapseBlanksFilter } from "./filters/collapse-blanks.ts";
import { createHeadTailFilter } from "./filters/head-tail.ts";
import { createDedupLinesFilter } from "./filters/dedup-lines.ts";
import { createStripTimestampsFilter } from "./filters/strip-timestamps.ts";
import { createShortenPathsFilter } from "./filters/shorten-paths.ts";
import { createStripNpmProgressFilter } from "./filters/strip-npm-progress.ts";
import { createStripGitDiffStatsFilter } from "./filters/strip-git-diff-stats.ts";
import { createCompactJsonFilter } from "./filters/compact-json.ts";
import { createStripTestRunnerHeaderFilter } from "./filters/strip-test-runner-header.ts";
import { createCollapseStackTracesFilter } from "./filters/collapse-stack-traces.ts";
import { createCustomRegexFilter } from "./filters/custom-regex.ts";

const FILTER_FACTORIES: Record<string, (args?: string) => Filter> = {
	"strip-ansi": () => createStripAnsiFilter(),
	"collapse-blanks": () => createCollapseBlanksFilter(),
	"head-tail": (args) => createHeadTailFilter(args ? parseInt(args, 10) : undefined),
	"dedup-lines": () => createDedupLinesFilter(),
	"strip-timestamps": () => createStripTimestampsFilter(),
	"shorten-paths": (args) => createShortenPathsFilter(args),
	"strip-npm-progress": () => createStripNpmProgressFilter(),
	"strip-git-diff-stats": () => createStripGitDiffStatsFilter(),
	"compact-json": () => createCompactJsonFilter(),
	"strip-test-runner-header": () => createStripTestRunnerHeaderFilter(),
	"collapse-stack-traces": () => createCollapseStackTracesFilter(),
	"custom-regex": (args) => createCustomRegexFilter(args),
};

function parseFilterSpec(spec: string): FilterSpec {
	const colonIdx = spec.indexOf(":");
	if (colonIdx === -1) return { name: spec.trim() };
	return { name: spec.slice(0, colonIdx).trim(), args: spec.slice(colonIdx + 1).trim() };
}

export function resolveFilters(specs: FilterSpec[]): Filter[] {
	const filters: Filter[] = [];
	for (const spec of specs) {
		const factory = FILTER_FACTORIES[spec.name];
		if (factory) {
			try {
				filters.push(factory(spec.args));
			} catch (error: unknown) {
				console.error(`[pi-smart] failed to create filter "${spec.name}": ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	}
	return filters;
}

export function resolveProfile(toolName: string, command: string | undefined, config: PiSmartConfig): Filter[] {
	if (!config.filters.enabled) return [];

	const profiles = config.filters.profiles;
	const specs: FilterSpec[] = [];

	// Most specific match first: "bash: npm test" > "bash: *" > toolName
	if (toolName === "bash" && command) {
		const specificKey = `bash: ${command}`;
		if (profiles[specificKey]) {
			return resolveFilters(profiles[specificKey].map(parseFilterSpec));
		}
		// Try matching by prefix (e.g., "npm" matches "npm test", "npm run build")
		for (const [key, value] of Object.entries(profiles)) {
			if (key.startsWith("bash: ") && key !== "bash: *") {
				const cmdPart = key.slice(6);
				if (command.startsWith(cmdPart) || command.includes(cmdPart)) {
					return resolveFilters(value.map(parseFilterSpec));
				}
			}
		}
		const wildcardKey = "bash: *";
		if (profiles[wildcardKey]) {
			return resolveFilters(profiles[wildcardKey].map(parseFilterSpec));
		}
	}

	// Direct tool name match
	if (profiles[toolName]) {
		return resolveFilters(profiles[toolName].map(parseFilterSpec));
	}

	// Default profile
	return resolveFilters((config.filters.defaultProfile ?? []).map(parseFilterSpec));
}
