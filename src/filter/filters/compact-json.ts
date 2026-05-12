import type { Filter } from "../pipeline.ts";

export function createCompactJsonFilter(): Filter {
	return {
		name: "compact-json",
		apply(text: string): string {
			// Try to detect and compact JSON blocks in the text
			return text.replace(/```(?:json)?\s*\n([\s\S]*?)```/g, (_match: string, jsonContent: string) => {
				try {
					const parsed: unknown = JSON.parse(jsonContent);
					const compacted = JSON.stringify(parsed, null, 2);
					// If compacted is large, truncate arrays/objects >20 items
					const limited = limitJsonObj(parsed);
					if (limited !== null) {
						return "```json\n" + JSON.stringify(limited, null, 2) + "\n```";
					}
					return "```json\n" + compacted + "\n```";
				} catch {
					return _match;
				}
			});
		},
	};
}

function limitJsonObj(obj: unknown, depth: number = 0): unknown {
	if (depth > 10) return obj;
	if (Array.isArray(obj)) {
		if (obj.length > 20) {
			return [...obj.slice(0, 10), `... ${obj.length - 20} items omitted ...`, ...obj.slice(-10)];
		}
		return obj.map((item) => limitJsonObj(item, depth + 1));
	}
	if (obj !== null && typeof obj === "object") {
		const entries = Object.entries(obj as Record<string, unknown>);
		if (entries.length > 20) {
			const result: Record<string, unknown> = {};
			for (let i = 0; i < 10; i++) {
				const entry = entries[i];
				if (entry) result[entry[0]] = limitJsonObj(entry[1], depth + 1);
			}
			result["..."] = `${entries.length - 20} keys omitted`;
			for (let i = entries.length - 10; i < entries.length; i++) {
				const entry = entries[i];
				if (entry) result[entry[0]] = limitJsonObj(entry[1], depth + 1);
			}
			return result;
		}
		const result: Record<string, unknown> = {};
		for (const [k, v] of entries) {
			result[k] = limitJsonObj(v, depth + 1);
		}
		return result;
	}
	return obj;
}
