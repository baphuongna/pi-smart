import type { Filter } from "../pipeline.ts";

export interface CustomRegexConfig {
	pattern: string;
	replacement: string;
	flags?: string;
}

// Complexity limits to prevent ReDoS and resource exhaustion
const MAX_PATTERN_LENGTH = 500;
const MAX_GROUPS = 20;
const MAX_QUANTIFIER_NESTING = 3;

/**
 * Check if a regex pattern is dangerously complex (ReDoS risk).
 * Returns an error message if unsafe, or null if safe.
 */
function validateRegexComplexity(pattern: string): string | null {
	if (pattern.length > MAX_PATTERN_LENGTH) {
		return `Pattern too long (${pattern.length} > ${MAX_PATTERN_LENGTH} chars)`;
	}

	// Count capturing groups
	const groupCount = (pattern.match(/\(/g) ?? []).length;
	if (groupCount > MAX_GROUPS) {
		return `Too many capturing groups (${groupCount} > ${MAX_GROUPS})`;
	}

	// Check for deeply nested quantifiers (ReDoS pattern)
	let quantifierNesting = 0;
	let maxQuantifierNesting = 0;
	let inCharClass = false;

	for (let i = 0; i < pattern.length; i++) {
		const ch = pattern[i]!;
		if (ch === "[") inCharClass = true;
		else if (ch === "]") inCharClass = false;
		else if (!inCharClass) {
			if (ch === "*" || ch === "+" || ch === "?") {
				quantifierNesting++;
				maxQuantifierNesting = Math.max(maxQuantifierNesting, quantifierNesting);
			} else if (ch === "\\") {
				i++; // skip escaped char
			} else if (ch === "|" || ch === ")") {
				quantifierNesting = Math.max(0, quantifierNesting - 1);
			}
		}
	}

	if (maxQuantifierNesting > MAX_QUANTIFIER_NESTING) {
		return `Too deeply nested quantifiers (${maxQuantifierNesting} > ${MAX_QUANTIFIER_NESTING})`;
	}

	// Check for catastrophic backtracking patterns like (a+)+
	const doubleQuantifier = /\([^)]*[*+][^)]*\)[*+]/;
	if (doubleQuantifier.test(pattern)) {
		return "Potentially catastrophic backtracking pattern (nested quantifiers on same group)";
	}

	return null;
}

export function createCustomRegexFilter(configStr?: string): Filter {
	if (!configStr) {
		return {
			name: "custom-regex",
			apply(text: string): string {
				return text;
			},
		};
	}

	let config: CustomRegexConfig;
	try {
		config = JSON.parse(configStr) as CustomRegexConfig;
	} catch {
		console.error(`[pi-smart] custom-regex: invalid JSON config: ${configStr}`);
		return {
			name: "custom-regex",
			apply(text: string): string {
				return text;
			},
		};
	}

	const { pattern, replacement, flags } = config;

	// Validate complexity before compilation
	const complexityError = validateRegexComplexity(pattern);
	if (complexityError) {
		console.error(`[pi-smart] custom-regex: ${complexityError}`);
		return {
			name: "custom-regex",
			apply(text: string): string {
				return text;
			},
		};
	}

	let regex: RegExp;
	try {
		regex = new RegExp(pattern, flags ?? "g");
	} catch {
		console.error(`[pi-smart] custom-regex: invalid regex: ${pattern}`);
		return {
			name: "custom-regex",
			apply(text: string): string {
				return text;
			},
		};
	}

	return {
		name: `custom-regex:${pattern.slice(0, 50)}${pattern.length > 50 ? "..." : ""}`,
		apply(text: string): string {
			return text.replace(regex, replacement);
		},
	};
}