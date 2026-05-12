import type { Filter } from "../pipeline.ts";

// Match npm/yarn/pnpm spinner characters and progress bar lines
const NPM_PROGRESS_REGEX = /^[^\S\n]*(?:⠼|⠴|⠦|⠧|⠇|⠏|⠋|⠙|⠹|⠸|⠺|⠖|⠒|●|◯|◉|○)/gm;
const PROGRESS_LINE_REGEX = /^[^\S\n]*(?:npm|yarn|pnpm)\s.*(WARN|warning|info).*$/gm;

export function createStripNpmProgressFilter(): Filter {
	return {
		name: "strip-npm-progress",
		apply(text: string): string {
			const lines = text.split("\n");
			return lines
				.filter((line) => !NPM_PROGRESS_REGEX.test(line) && !PROGRESS_LINE_REGEX.test(line))
				.join("\n");
		},
	};
}
