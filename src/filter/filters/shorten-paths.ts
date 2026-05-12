import type { Filter } from "../pipeline.ts";

export function createShortenPathsFilter(projectRoot?: string): Filter {
	const root = projectRoot || process.cwd();
	const normalizedRoot = root.replace(/\\/g, "/") + "/";
	// Match Windows user paths: C:\Users\<user>\
	const winUserRegex = /^[A-Za-z]:\\Users\\[^\\]+\\/g;
	return {
		name: "shorten-paths",
		apply(text: string): string {
			let result = text;
			// Shorten project root paths
			result = result.split(normalizedRoot).join("./");
			// Shorten Windows user paths
			result = result.replace(winUserRegex, "~/");
			// Shorten remaining long paths: keep last 3 segments
			result = result.replace(/(?:\/[\w.-]+){4,}/g, (match: string) => {
				const segments = match.split("/");
				if (segments.length <= 4) return match;
				return "/.../" + segments.slice(-3).join("/");
			});
			return result;
		},
	};
}
