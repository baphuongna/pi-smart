import type { Intensity } from "../config.ts";

export interface CompressionResult {
	text: string;
	tokensBefore: number;
	tokensAfter: number;
	reductionPct: number;
}

// Filler phrases to remove in terse/normal mode
const FILLER_PHRASES = [
	"I think ",
	"It seems like ",
	"You might want to ",
	"The reason is that ",
	"In my opinion, ",
	"I would say ",
	"Let me explain ",
	"Here's the thing: ",
	"Basically, ",
	"Essentially, ",
	"To be honest, ",
	"As far as I can tell, ",
];

const PLEASANTRY_LINES = [
	"Sure!",
	"Great question!",
	"Hope this helps!",
	"Happy to help!",
	"Let me know if you need anything else!",
	"Does that make sense?",
	"Good question!",
];

/**
 * Estimate token count (rough: ~4 chars per token)
 */
function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

/**
 * Check if a line is inside a code block
 */
function isInsideCodeBlock(lines: string[], lineIdx: number): boolean {
	let count = 0;
	for (let i = 0; i <= lineIdx; i++) {
		if (lines[i]!.trimStart().startsWith("```")) count++;
	}
	return count % 2 === 1;
}

/**
 * Apply caveman compression — keep only code, identifiers, paths, commands, errors
 */
export function cavemanCompress(text: string): CompressionResult {
	const tokensBefore = estimateTokens(text);
	const lines = text.split("\n");
	const result: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;

		// Always keep code blocks, list items, paths, commands
		if (isInsideCodeBlock(lines, i)) {
			result.push(line);
			continue;
		}

		// Keep lines with code-like content (backticks, paths, commands)
		if (/`/.test(line) || /\/[\w.-]+/.test(line) || /^\s*\$\s/.test(line) || /^\s*[-*]\s/.test(line)) {
			result.push(stripFiller(line));
			continue;
		}

		// Keep empty lines
		if (line.trim() === "") {
			// Collapse consecutive blank lines
			if (result.length > 0 && result[result.length - 1]!.trim() !== "") {
				result.push(line);
			}
			continue;
		}

		// For prose lines, strip filler and keep if meaningful
		const stripped = stripFiller(line);
		if (stripped.trim().length > 0) {
			result.push(stripped);
		}
	}

	const output = result.join("\n");
	const tokensAfter = estimateTokens(output);
	const reductionPct = tokensBefore > 0 ? Math.round(((tokensBefore - tokensAfter) / tokensBefore) * 100) : 0;

	return { text: output, tokensBefore, tokensAfter, reductionPct };
}

function stripFiller(line: string): string {
	let result = line;
	for (const phrase of FILLER_PHRASES) {
		result = result.replace(phrase, "");
	}
	// Remove pleasantries at line start
	for (const pleasantry of PLEASANTRY_LINES) {
		if (result.trim() === pleasantry) return "";
		if (result.trimStart().startsWith(pleasantry + " ")) {
			result = result.slice(result.indexOf(pleasantry) + pleasantry.length + 1);
		}
	}
	return result;
}

/**
 * Apply light compression for normal mode — remove pleasantries only
 */
export function lightCompress(text: string): CompressionResult {
	const tokensBefore = estimateTokens(text);
	const lines = text.split("\n");
	const result: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		if (isInsideCodeBlock(lines, i)) {
			result.push(line);
			continue;
		}
		const isPleasantry = PLEASANTRY_LINES.some((p) => line.trim() === p);
		if (!isPleasantry) {
			result.push(line);
		}
	}

	const output = result.join("\n");
	const tokensAfter = estimateTokens(output);
	const reductionPct = tokensBefore > 0 ? Math.round(((tokensBefore - tokensAfter) / tokensBefore) * 100) : 0;

	return { text: output, tokensBefore, tokensAfter, reductionPct };
}

/**
 * Apply compression based on intensity level
 */
export function compressByIntensity(text: string, intensity: Intensity): CompressionResult {
	switch (intensity) {
		case "terse":
			return cavemanCompress(text);
		case "normal":
			return lightCompress(text);
		case "verbose":
			return { text, tokensBefore: estimateTokens(text), tokensAfter: estimateTokens(text), reductionPct: 0 };
	}
}
