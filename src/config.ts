import * as fs from "node:fs";
import * as path from "node:path";

export type Intensity = "terse" | "normal" | "verbose";
export type BudgetState = "NORMAL" | "FRUGAL" | "COMPACT" | "EMERGENCY";

export interface FilterSpec {
	name: string;
	args?: string;
}

export interface BudgetThresholds {
	frugal: number;
	compact: number;
	emergency: number;
}

export interface PiSmartConfig {
	enabled: boolean;
	filters: {
		enabled: boolean;
		profiles: Record<string, string[]>;
		defaultProfile: string[];
	};
	compression: {
		enabled: boolean;
		intensity: Intensity;
		autoIntensify: boolean;
	};
	budget: {
		enabled: boolean;
		thresholds: BudgetThresholds;
		criticalPins: string[];
	};
	cost: {
		enabled: boolean;
		showWidget: boolean;
		pricing: Record<string, { inputPerMillion?: number; outputPerMillion?: number; cacheReadPerMillion?: number; cacheWritePerMillion?: number }>;
	};
	analyze: {
		enabled: boolean;
		timeout: number;
		maxOutputBytes: number;
		allowNetwork: boolean;
	};
}

const DEFAULT_CONFIG: PiSmartConfig = {
	enabled: true,
	filters: {
		enabled: true,
		profiles: {
			"bash: npm test": ["strip-ansi", "collapse-blanks", "head-tail:30"],
			"bash: npm run build": ["strip-ansi", "collapse-blanks", "dedup-lines", "head-tail:20"],
			"bash: git log": ["strip-timestamps", "head-tail:40"],
			"bash: git diff": ["strip-git-diff-stats", "collapse-blanks"],
			"bash: git status": [],
			"bash: *": ["strip-ansi", "collapse-blanks", "head-tail:100"],
			"read": ["collapse-blanks", "head-tail:200"],
			"grep": ["collapse-blanks", "head-tail:50"],
			"ls": ["collapse-blanks"],
			"find": ["collapse-blanks", "head-tail:50"],
		},
		defaultProfile: ["strip-ansi", "collapse-blanks", "head-tail:100"],
	},
	compression: {
		enabled: true,
		intensity: "normal",
		autoIntensify: true,
	},
	budget: {
		enabled: true,
		thresholds: { frugal: 0.6, compact: 0.8, emergency: 0.9 },
		criticalPins: ["task", "activeFiles", "errorState", "conventions"],
	},
	cost: {
		enabled: true,
		showWidget: true,
		pricing: {},
	},
	analyze: {
		enabled: true,
		timeout: 30000,
		maxOutputBytes: 5120,
		allowNetwork: false,
	},
};

export function loadSmartConfig(cwd: string): PiSmartConfig {
	const configPath = path.join(cwd, ".pi", "pi-smart.json");
	if (!fs.existsSync(configPath)) {
		return { ...DEFAULT_CONFIG };
	}
	try {
		const raw = fs.readFileSync(configPath, "utf-8");
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_CONFIG };
		return deepMerge({ ...DEFAULT_CONFIG } as unknown as Record<string, unknown>, parsed as Record<string, unknown>) as unknown as PiSmartConfig;
	} catch {
		return { ...DEFAULT_CONFIG };
	}
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = { ...base };
	for (const key of Object.keys(override)) {
		const ov = override[key];
		const bv = base[key];
		if (ov !== null && typeof ov === "object" && !Array.isArray(ov) && bv !== null && typeof bv === "object" && !Array.isArray(bv)) {
			result[key] = deepMerge(bv as Record<string, unknown>, ov as Record<string, unknown>);
		} else if (ov !== undefined) {
			result[key] = ov;
		}
	}
	return result;
}
