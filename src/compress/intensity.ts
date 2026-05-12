import type { Intensity, BudgetState } from "../config.ts";

export const DEFAULT_INTENSITY: Intensity = "normal";

export const INTENSITY_ORDER: Intensity[] = ["terse", "normal", "verbose"];

export function getIntensityForBudgetState(budgetState: BudgetState): Intensity {
	switch (budgetState) {
		case "NORMAL":
			return "normal";
		case "FRUGAL":
			return "terse";
		case "COMPACT":
			return "terse";
		case "EMERGENCY":
			return "terse";
	}
}

export function getOutputAllowanceMultiplier(budgetState: BudgetState): number {
	const multipliers: Record<BudgetState, number> = {
		NORMAL: 1.0,
		FRUGAL: 0.5,
		COMPACT: 0.25,
		EMERGENCY: 0.1,
	};
	return multipliers[budgetState];
}

export function validateIntensity(value: string): Intensity | null {
	if (value === "terse" || value === "normal" || value === "verbose") return value;
	return null;
}
