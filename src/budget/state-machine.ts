import type { BudgetState, BudgetThresholds } from "../config.ts";

export interface StateTransition {
	from: BudgetState;
	to: BudgetState;
	threshold: number;
}

const TRANSITION_ORDER: BudgetState[] = ["NORMAL", "FRUGAL", "COMPACT", "EMERGENCY"];

export function computeBudgetState(percentage: number, thresholds: BudgetThresholds): BudgetState {
	if (percentage >= thresholds.emergency) return "EMERGENCY";
	if (percentage >= thresholds.compact) return "COMPACT";
	if (percentage >= thresholds.frugal) return "FRUGAL";
	return "NORMAL";
}

export function getSteeringMessage(state: BudgetState): string | null {
	switch (state) {
		case "NORMAL":
			return null;
		case "FRUGAL":
			return "[pi-smart] Respond in terse/caveman mode. Be extremely brief.";
		case "COMPACT":
			return "[pi-smart] Maximum brevity. Code only. No explanations.";
		case "EMERGENCY":
			return "[pi-smart] EMERGENCY: Context nearly full. Code only. One-line answers only.";
	}
}

export function shouldAutoCompact(state: BudgetState): boolean {
	return state === "COMPACT" || state === "EMERGENCY";
}

export function getStateTransitions(currentState: BudgetState, percentage: number, thresholds: BudgetThresholds): StateTransition {
	const newState = computeBudgetState(percentage, thresholds);
	return { from: currentState, to: newState, threshold: percentage };
}
